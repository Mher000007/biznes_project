import { Router } from 'express';
import {
  createBooking,
  getBookingsByBusiness,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = Router();

// Public route for customers to book services
router.post('/', createBooking);

// Protected routes for business owners
router.get('/business/:businessId', authenticate, requireVerified, getBookingsByBusiness);
router.put('/:id/status', authenticate, requireVerified, updateBookingStatus);

export default router;
