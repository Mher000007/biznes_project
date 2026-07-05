import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

// ─── GET USER NOTIFICATIONS ──────────────────────────────────────────────────
export const getNotifications = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    // Get notifications where user is in recipients OR it is a broadcast
    const notifications = await Notification.find({
      $or: [
        { recipients: userId },
        { broadcast: true },
      ],
    }).sort({ createdAt: -1 }).limit(50);

    res.status(200).json({ success: true, data: notifications });
  }
);

// ─── MARK NOTIFICATION AS READ ───────────────────────────────────────────────
export const markNotificationAsRead = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    // Add user to readBy array if not already present
    if (!notification.readBy.includes(userId as any)) {
      notification.readBy.push(userId as any);
      await notification.save();
    }

    res.status(200).json({ success: true, message: 'Marked as read' });
  }
);
