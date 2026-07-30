import { Router } from 'express';
import {
  getReviews,
  createReview,
  deleteReview,
  markHelpful,
  reportReview,
} from '../controllers/reviewController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = Router({ mergeParams: true }); // inherits :businessId from parent

// Public
router.get('/', getReviews);
router.post('/:reviewId/helpful', markHelpful);

// Protected routes (strictly require authenticated + email-verified user)
router.post('/', authenticate, requireVerified, createReview);
router.delete('/:reviewId', authenticate, requireVerified, deleteReview);
router.post('/:reviewId/report', authenticate, requireVerified, reportReview);

export default router;
