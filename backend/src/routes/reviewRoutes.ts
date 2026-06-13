import { Router } from 'express';
import {
  getReviews,
  createReview,
  deleteReview,
  markHelpful,
  reportReview,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router({ mergeParams: true }); // inherits :businessId from parent

// Public
router.get('/', getReviews);
router.post('/:reviewId/helpful', markHelpful);

// Public or protected (manually verified for optional auth in controller)
router.post('/', createReview);
router.delete('/:reviewId', authenticate, deleteReview);
router.post('/:reviewId/report', authenticate, reportReview);

export default router;
