import { Router } from 'express';
import passport from 'passport';
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
  deleteAccount,
  oauthSuccessCallback,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  availabilityLimiter,
  verificationLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', registerLimiter, register);
router.get('/check-availability', availabilityLimiter, checkAvailability);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refreshTokenHandler);

// OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/signin?error=google_oauth_failed' }),
  oauthSuccessCallback
);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/signin?error=facebook_oauth_failed' }),
  oauthSuccessCallback
);

// Password reset & email verification routes
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/send-verification', authenticate, verificationLimiter, sendEmailVerification);
router.post('/verify-email', verifyEmail);

router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

export default router;
