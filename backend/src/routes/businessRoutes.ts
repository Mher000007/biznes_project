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
  getBusinessAnalytics,
  getCalendarSummaries,
  updateDailySummary,
  checkBusinessDateStatus,
  toggleSaveBusiness,
} from '../controllers/businessController.js';
import {
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/businessLocationController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';
import reviewRoutes from './reviewRoutes.js';

const router = Router({ mergeParams: true });

// ── Static paths FIRST (must come before /:id) ─────────────────────────────
router.get('/me/all', authenticate, requireVerified, getMyBusinesses);
router.post('/onboard', authenticate, createBusiness);

// ── Public routes ────────────────────────────────────────────────────────────
router.get('/', getBusinesses);
router.get('/slug/:slug', getBusinessBySlug);
router.get('/:id/calendar/check-date', checkBusinessDateStatus);

// ── Protected CRUD ───────────────────────────────────────────────────────────
router.post('/', authenticate, createBusiness);
router.get('/:id', getBusinessById);
router.put('/:id', authenticate, requireVerified, updateBusiness);
router.delete('/:id', authenticate, requireVerified, deleteBusiness);
router.post('/:id/rate', rateBusiness);
router.post('/:id/toggle-save', toggleSaveBusiness);
router.get('/:id/analytics', authenticate, requireVerified, getBusinessAnalytics);
router.get('/:id/calendar', authenticate, requireVerified, getCalendarSummaries);
router.post('/:id/calendar/:date', authenticate, requireVerified, updateDailySummary);

// ── Nested review routes → /businesses/:businessId/reviews ───────────────────
router.use('/:businessId/reviews', reviewRoutes);

// ── Locations routes ─────────────────────────────────────────────────────────
router.get('/:businessId/locations', getLocations);
router.post('/:businessId/locations', authenticate, requireVerified, addLocation);
router.put('/locations/:id', authenticate, requireVerified, updateLocation);
router.delete('/locations/:id', authenticate, requireVerified, deleteLocation);

export default router;
