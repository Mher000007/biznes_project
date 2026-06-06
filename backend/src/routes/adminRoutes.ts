import { Router } from 'express';
import { getReportedReviews, resolveReportedReview } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Secure all admin routes to require admin role
router.use(authenticate, authorize('admin'));

router.get('/reports', getReportedReviews);
router.put('/reports/:reviewId/resolve', resolveReportedReview);

export default router;
