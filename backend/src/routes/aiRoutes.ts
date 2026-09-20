import { Router } from 'express';
import { generateCaption } from '../controllers/aiController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = Router();

// Protected AI routes
router.post('/generate-caption', authenticate, requireVerified, generateCaption);

export default router;
