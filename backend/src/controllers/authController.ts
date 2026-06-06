import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Register
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Please provide name, email, and password' });
    return;
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: 'User already exists with that email' });
    return;
  }

  const user = new User({
    name,
    email,
    password,
    phone,
  });

  await user.save();

  const token = jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: (process.env.JWT_EXPIRE as any) || '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Login
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Please provide email and password' });
    return;
  }

  // Find user and select password field
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: (process.env.JWT_EXPIRE as any) || '7d' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Get current user
export const getCurrentUser = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const user = await User.findById(req.user?.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);

// Update user profile
export const updateProfile = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const { name, phone, bio, avatar, location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      {
        name,
        phone,
        bio,
        avatar,
        location,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  }
);
