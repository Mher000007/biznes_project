import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

declare global {
  namespace Express {
    interface User {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
      [key: string]: any;
    }
  }
}

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies?.armbiz_at || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'armbiz_dev_secret_key_2026');
    req.user = decoded as AuthRequest['user'];
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireVerified = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  // Fast path: if verified boolean is in JWT payload, check directly
  if (typeof req.user.verified === 'boolean') {
    if (!req.user.verified) {
      res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address to access this feature.',
      });
      return;
    }
    next();
    return;
  }

  // Fallback for tokens where verified was omitted: query DB
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc || !userDoc.verified) {
      res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address to access this feature.',
      });
      return;
    }
    req.user.verified = userDoc.verified;
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Verification check failed',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    next();
  };
};
