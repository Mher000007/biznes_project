import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendEmail } from '../utils/sendEmail.js';

// ─── Helper: Cookie Options ──────────────────────────────────────────────────
function getCookieOptions(isRefreshToken = false) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSiteSetting = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || (isProduction ? 'none' : 'lax');
  const refreshPath = process.env.COOKIE_REFRESH_PATH || '/';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSiteSetting,
    path: isRefreshToken ? refreshPath : '/',
    ...(isRefreshToken
      ? { maxAge: 7 * 24 * 60 * 60 * 1000 }
      : { maxAge: 15 * 60 * 1000 }),
  };
}

function validatePasswordPolicy(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (!hasUpper || !hasLower || !hasNumber) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    };
  }
  return { valid: true };
}

function signAccessToken(user: IUser) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'armbiz_dev_secret_key_2026',
    { expiresIn: '15m' }
  );
}

export async function createAndSetTokens(res: Response, user: IUser) {
  const accessToken = signAccessToken(user);
  const refreshTokenRaw = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });

  res.cookie('armbiz_at', accessToken, getCookieOptions(false));
  res.cookie('armbiz_rt', refreshTokenRaw, getCookieOptions(true));

  return accessToken;
}

export function clearAuthCookies(res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSiteSetting = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || (isProduction ? 'none' : 'lax');
  const refreshPath = process.env.COOKIE_REFRESH_PATH || '/';

  res.clearCookie('armbiz_at', {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSiteSetting,
    path: '/',
  });
  res.clearCookie('armbiz_rt', {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSiteSetting,
    path: refreshPath,
  });
}

export function userPayload(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    accountType: user.accountType,
    avatar: user.avatar,
    phone: user.phone,
    findyCoins: user.findyCoins || 0,
    verified: user.verified,
  };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, username, email, password, phone, contactEmail, accountType, inviteCode } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    return;
  }

  const passCheck = validatePasswordPolicy(password);
  if (!passCheck.valid) {
    res.status(400).json({ success: false, message: passCheck.message });
    return;
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.toLowerCase().trim();
  const trimmedUsername = username ? username.toLowerCase().trim() : '';

  // Check if Name (Display Name) already exists (case-insensitive)
  if (trimmedName) {
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameExists = await User.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
    if (nameExists) {
      res.status(409).json({ success: false, message: 'Այս Անունը (Name) արդեն զբաղված է: / That Name is already taken.' });
      return;
    }
  }

  // Check if Username already exists
  if (trimmedUsername) {
    const usernameExists = await User.findOne({ username: trimmedUsername });
    if (usernameExists) {
      res.status(409).json({ success: false, message: 'Այս Օգտանունը (Username) արդեն զբաղված է: / That Username is already taken.' });
      return;
    }
  }

  // Check if email already exists
  const emailExists = await User.findOne({ email: trimmedEmail });
  if (emailExists) {
    res.status(409).json({ success: false, message: 'Այս էլ. հասցեով (Email) հաշիվ արդեն գոյություն ունի: / An account with that email already exists.' });
    return;
  }

  // Process invite code bonus (+100 Coins for both inviter & new user)
  let initialCoins = 0;
  if (inviteCode && typeof inviteCode === 'string' && inviteCode.trim()) {
    const cleanInvite = inviteCode.trim().toLowerCase();
    const inviter = await User.findOne({
      $or: [
        { username: cleanInvite },
        { name: new RegExp(`^${cleanInvite}$`, 'i') }
      ]
    });
    if (inviter) {
      inviter.findyCoins = (inviter.findyCoins || 0) + 100;
      await inviter.save();
      initialCoins = 100;
    }
  }

  const user = new User({
    name: trimmedName,
    username: trimmedUsername || undefined,
    email: trimmedEmail,
    password,
    phone,
    contactEmail,
    accountType: accountType || 'personal',
    role: accountType === 'business' ? 'business_owner' : 'user',
    findyCoins: initialCoins,
  });

  await user.save();

  await createAndSetTokens(res, user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    user: userPayload(user),
  });
});

// ─── Check Availability ──────────────────────────────────────────────────────
export const checkAvailability = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, username, email } = req.query;

  let nameTaken = false;
  let usernameTaken = false;
  let emailTaken = false;

  if (typeof name === 'string' && name.trim()) {
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameMatch = await User.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
    if (nameMatch) nameTaken = true;
  }

  if (typeof username === 'string' && username.trim()) {
    const usernameMatch = await User.findOne({ username: username.toLowerCase().trim() });
    if (usernameMatch) usernameTaken = true;
  }

  if (typeof email === 'string' && email.trim()) {
    const emailMatch = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailMatch) emailTaken = true;
  }

  const isTaken = nameTaken || usernameTaken || emailTaken;

  res.json({
    success: true,
    available: !isTaken,
  });
});

// ─── Login (email OR username) ────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    return;
  }

  const identifier = email.trim().toLowerCase();
  const isEmail = identifier.includes('@');

  // Find user by email OR username, always include password
  const user = await User.findOne(
    isEmail ? { email: identifier } : { username: identifier }
  ).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  await createAndSetTokens(res, user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: userPayload(user),
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshTokenRaw = req.cookies?.armbiz_rt;
  if (refreshTokenRaw) {
    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
  }
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshTokenHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshTokenRaw = req.cookies?.armbiz_rt;
  if (!refreshTokenRaw) {
    clearAuthCookies(res);
    res.status(401).json({ success: false, message: 'Refresh token required' });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
  const existingToken = await RefreshToken.findOne({
    tokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!existingToken) {
    clearAuthCookies(res);
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    return;
  }

  // Revoke old refresh token (rotation)
  existingToken.isRevoked = true;
  await existingToken.save();

  const user = await User.findById(existingToken.user);
  if (!user) {
    clearAuthCookies(res);
    res.status(401).json({ success: false, message: 'User no longer exists' });
    return;
  }

  await createAndSetTokens(res, user);

  res.status(200).json({
    success: true,
    user: userPayload(user),
  });
});

// ─── Get current user (/auth/me) ─────────────────────────────────────────────
export const getCurrentUser = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const user = await User.findById(req.user?.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: userPayload(user),
    });
  }
);

// ─── Update user profile ──────────────────────────────────────────────────────
export const updateProfile = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const { name, phone, bio, avatar, location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { name, phone, bio, avatar, location, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userPayload(user),
    });
  }
);

// ─── Change password ──────────────────────────────────────────────────────────
export const changePassword = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
      return;
    }

    const passCheck = validatePasswordPolicy(newPassword);
    if (!passCheck.valid) {
      res.status(400).json({ success: false, message: passCheck.message });
      return;
    }

    const user = await User.findById(req.user?.id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Incorrect current password' });
      return;
    }

    user.password = newPassword;
    await user.save();

    // Revoke all active refresh tokens for this user on password change
    await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });
    await createAndSetTokens(res, user);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }
);

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });

  // Generic response to prevent user enumeration
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  if (!user) {
    res.status(200).json(genericResponse);
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

  const message = `You requested a password reset for your ArmBiz account. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`;
  const html = `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
    <h2 style="color: #0f172a; margin-top: 0;">Reset Your Password</h2>
    <p style="color: #475569; line-height: 1.6;">You requested a password reset for your ArmBiz account. Click the button below to set a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #94a3b8; font-size: 13px;">This link will expire in 1 hour.<br/>If you did not request a password reset, please ignore this email.</p>
  </div>`;

  await sendEmail({
    email: user.email,
    subject: 'ArmBiz Password Reset Request',
    message,
    html,
  });

  res.status(200).json(genericResponse);
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ success: false, message: 'Token and new password are required' });
    return;
  }

  const passCheck = validatePasswordPolicy(password);
  if (!passCheck.valid) {
    res.status(400).json({ success: false, message: passCheck.message });
    return;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    return;
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Revoke active sessions & issue new ones
  await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });
  await createAndSetTokens(res, user);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
    user: userPayload(user),
  });
});

// ─── Send Email Verification ──────────────────────────────────────────────────
export const sendEmailVerification = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (user.verified) {
    res.status(400).json({ success: false, message: 'Email is already verified' });
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl}/verify-email?token=${rawToken}`;

  const message = `Please verify your email address for ArmBiz by clicking the link below:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.`;
  const html = `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
    <h2 style="color: #0f172a; margin-top: 0;">Verify Your Email Address</h2>
    <p style="color: #475569; line-height: 1.6;">Thank you for registering with ArmBiz! Please click the button below to verify your email address:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email</a>
    </div>
    <p style="color: #94a3b8; font-size: 13px;">This link will expire in 24 hours.</p>
  </div>`;

  await sendEmail({
    email: user.email,
    subject: 'Verify Your ArmBiz Email Address',
    message,
    html,
  });

  res.status(200).json({
    success: true,
    message: 'Verification email sent',
  });
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ success: false, message: 'Verification token is required' });
    return;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({ success: false, message: 'Invalid or expired email verification token' });
    return;
  }

  user.verified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    user: userPayload(user),
  });
});
