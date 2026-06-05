import { Router } from 'express';
import {
  createInquiry,
  getBusinessInquiries,
  updateInquiryStatus,
  getUserInquiries,
} from '../controllers/inquiryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public route
router.post('/', createInquiry);

// Protected routes
router.get('/business/:businessId', authenticate, getBusinessInquiries);
router.put('/:inquiryId', authenticate, updateInquiryStatus);
router.get('/user/all', authenticate, getUserInquiries);

export default router;
