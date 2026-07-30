import { Router } from 'express';
import {
  subscribe,
  getSubscription,
  activatePromoCode,
} from '../controllers/subscriptionController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = Router();

// Protected routes
router.post('/subscribe', authenticate, requireVerified, subscribe);
router.get('/business/:businessId', authenticate, requireVerified, getSubscription);
router.post('/promo/activate', authenticate, requireVerified, activatePromoCode);

export default router;
