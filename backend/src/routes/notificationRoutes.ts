import { Router } from 'express';
import { getNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = Router();

// All notification routes require valid JWT + email verification
router.use(authenticate, requireVerified);

router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);

export default router;
