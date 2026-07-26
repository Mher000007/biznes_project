import { Router } from 'express';
import {
  getAdminStats,
  getBusinesses,
  approveBusiness,
  rejectBusiness,
  deleteBusiness,
  getBookings,
  deleteBooking,
  getSubscriptions,
  deleteSubscription,
  getReportedReviews,
  resolveReportedReview,
  getUsers,
  deleteUser,
  topUpUserCoins,
  giftSubscription,
  getSubscriptionGifts,
  getPromoCodes,
  createPromoCode,
  togglePromoCode,
  deletePromoCode,
  sendNotification,
  getHeroImages,
  updateHeroImages,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require valid JWT + admin role
router.use(authenticate, authorize('admin'));

// Stats
router.get('/stats', getAdminStats);

// Businesses
router.get('/businesses', getBusinesses);
router.put('/businesses/:id/approve', approveBusiness);
router.put('/businesses/:id/reject', rejectBusiness);
router.delete('/businesses/:id', deleteBusiness);

// Bookings
router.get('/bookings', getBookings);
router.delete('/bookings/:id', deleteBooking);

// Subscriptions
router.get('/subscriptions', getSubscriptions);
router.delete('/subscriptions/:id', deleteSubscription);

// Review moderation
router.get('/reports', getReportedReviews);
router.put('/reports/:reviewId/resolve', resolveReportedReview);

// Users
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/coins', topUpUserCoins);

// Gift Subscription
router.post('/businesses/:id/gift', giftSubscription);
router.get('/gifts', getSubscriptionGifts);

// Promo Codes
router.get('/promos', getPromoCodes);
router.post('/promos', createPromoCode);
router.put('/promos/:id/toggle', togglePromoCode);
router.delete('/promos/:id', deletePromoCode);

// Notifications
router.post('/notifications/send', sendNotification);

// Hero carousel images
router.put('/hero-images', updateHeroImages);
router.get('/hero-images', getHeroImages);

export default router;
