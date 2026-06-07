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
import { authenticate } from '../middleware/auth.js';
import reviewRoutes from './reviewRoutes.js';

const router = Router({ mergeParams: true });

// ── Static paths FIRST (must come before /:id) ─────────────────────────────
router.get('/me/all', authenticate, getMyBusinesses);
router.post('/onboard', authenticate, createBusiness);

// ── Public routes ────────────────────────────────────────────────────────────
router.get('/', getBusinesses);
router.get('/slug/:slug', getBusinessBySlug);

// ── Protected CRUD ───────────────────────────────────────────────────────────
router.post('/', authenticate, createBusiness);
router.get('/:id', getBusinessById);
router.put('/:id', authenticate, updateBusiness);
router.delete('/:id', authenticate, deleteBusiness);
router.post('/:id/rate', rateBusiness);

// ── Nested review routes → /businesses/:businessId/reviews ───────────────────
router.use('/:businessId/reviews', reviewRoutes);

export default router;
