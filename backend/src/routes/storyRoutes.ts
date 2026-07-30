import { Router } from 'express';
import {
  createStory,
  getActiveStories,
  getMyBusinessStories,
  viewStory,
  deleteStory
} from '../controllers/storyController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getActiveStories);
router.post('/:id/view', viewStory);

// Protected routes
router.post('/', authenticate, requireVerified, createStory);
router.get('/my-business', authenticate, requireVerified, getMyBusinessStories);
router.delete('/:id', authenticate, requireVerified, deleteStory);

export default router;
