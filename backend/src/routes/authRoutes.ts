import { Router } from 'express';
import { register, login, getCurrentUser, updateProfile, changePassword, checkAvailability } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.get('/check-availability', checkAvailability);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
