import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshTokenHandler,
  getCurrentUser,
  updateProfile,
  changePassword,
  checkAvailability,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  authLimiter,
  passwordResetLimiter,
  availabilityLimiter,
  verificationLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.get('/check-availability', availabilityLimiter, checkAvailability);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refreshTokenHandler);

// Password reset & email verification routes
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/send-verification', authenticate, verificationLimiter, sendEmailVerification);
router.post('/verify-email', verifyEmail);

router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
