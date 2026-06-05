import { Router } from 'express';
import {
  getBusinesses,
  getBusinessById,
  getBusinessBySlug,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getMyBusinesses,
  rateBusiness,
} from '../controllers/businessController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getBusinesses);
router.get('/slug/:slug', getBusinessBySlug);
router.get('/:id', getBusinessById);
router.post('/:id/rate', rateBusiness);

// Protected routes
router.post('/', authenticate, createBusiness);
router.post('/onboard', authenticate, createBusiness);
router.get('/me/all', authenticate, getMyBusinesses);
router.put('/:id', authenticate, updateBusiness);
router.delete('/:id', authenticate, deleteBusiness);

export default router;
