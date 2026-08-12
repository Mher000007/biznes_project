import { Router } from 'express';
import {
  createBooking,
  getBookingsByBusiness,
  updateBookingStatus,
  getUserBookings,
  verifyBookingQr,
  deleteBooking,
} from '../controllers/bookingController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = Router();

// Public route for customers to book services
router.post('/', createBooking);

// Protected routes for business owners
router.get('/business/:businessId', authenticate, requireVerified, getBookingsByBusiness);
router.put('/:id/status', authenticate, requireVerified, updateBookingStatus);
router.delete('/:id', authenticate, requireVerified, deleteBooking);
router.post('/verify-qr', authenticate, requireVerified, verifyBookingQr);

// Protected route for users to get their bookings
router.get('/user', authenticate, requireVerified, getUserBookings);

export default router;
