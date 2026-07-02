import { Router } from 'express';
import {
  subscribe,
  getSubscription,
  activatePromoCode,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protected routes
router.post('/subscribe', authenticate, subscribe);
router.get('/business/:businessId', authenticate, getSubscription);
router.post('/promo/activate', authenticate, activatePromoCode);

export default router;
