import rateLimit from 'express-rate-limit';

// Rate limiter for login: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

// Rate limiter for registration: 20 attempts per 15 minutes per IP (allows normal form validation retries)
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again after 15 minutes.',
  },
});

// Rate limiter for password reset requests: 3 requests per 15 minutes per IP
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP. Please try again after 15 minutes.',
  },
});

// Rate limiter for availability checks: 20 requests per 15 minutes per IP
export const availabilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many availability checks from this IP. Please try again later.',
  },
});

// Rate limiter for verification email sends: 3 requests per 15 minutes per IP
export const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification email requests. Please check your inbox or try again later.',
  },
});
