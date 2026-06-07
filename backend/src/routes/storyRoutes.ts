import { Router } from 'express';
import {
  createStory,
  getActiveStories,
  getMyBusinessStories,
  viewStory,
  deleteStory
} from '../controllers/storyController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getActiveStories);
router.post('/:id/view', viewStory);

// Protected routes
router.post('/', authenticate, createStory);
router.get('/my-business', authenticate, getMyBusinessStories);
router.delete('/:id', authenticate, deleteStory);

export default router;
