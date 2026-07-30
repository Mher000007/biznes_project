import { Router } from 'express';
import {
  createInquiry,
  getBusinessInquiries,
  updateInquiryStatus,
  getUserInquiries,
} from '../controllers/inquiryController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = Router();

// Public route
router.post('/', createInquiry);

// Protected routes
router.get('/business/:businessId', authenticate, requireVerified, getBusinessInquiries);
router.put('/:inquiryId', authenticate, requireVerified, updateInquiryStatus);
router.get('/user/all', authenticate, requireVerified, getUserInquiries);

export default router;
