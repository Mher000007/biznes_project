import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
function signToken(user: IUser) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'armbiz_dev_secret_key_2026',
    { expiresIn: (process.env.JWT_EXPIRE as any) || '7d' }
  );
}

function userPayload(user: IUser) {
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
  };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, username, email, password, phone, contactEmail, accountType } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
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

  const user = new User({
    name: trimmedName,
    username: trimmedUsername || undefined,
    email: trimmedEmail,
    password,
    plainPassword: password,
    phone,
    contactEmail,
    accountType: accountType || 'personal',
    role: accountType === 'business' ? 'business_owner' : 'user',
  });

  await user.save();

  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
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

  res.json({
    success: true,
    nameTaken,
    usernameTaken,
    emailTaken,
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

  const token = signToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
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

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }
);
