import { Response } from 'express';
import Review from '../models/Review.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendReportResolutionEmail } from '../utils/emailService.js';

// ─── GET all reported reviews ────────────────────────────────────────────────
export const getReportedReviews = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const reports = await Review.find({ status: 'reported' })
      .sort({ reportedAt: -1 })
      .populate({
        path: 'business',
        select: 'name email owner',
        populate: {
          path: 'owner',
          select: 'name email',
        },
      })
      .populate('author', 'name email avatar');

    res.status(200).json({
      success: true,
      data: reports,
    });
  }
);

// ─── RESOLVE a reported review ───────────────────────────────────────────────
export const resolveReportedReview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { reviewId } = req.params;
    const { action, adminReply } = req.body;

    if (!reviewId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ success: false, message: 'Invalid review ID format' });
      return;
    }

    if (!action || !['keep', 'delete'].includes(action)) {
      res.status(400).json({ success: false, message: 'Invalid action. Must be "keep" or "delete"' });
      return;
    }

    if (!adminReply || typeof adminReply !== 'string' || adminReply.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Admin reply is required and must be at least 5 characters' });
      return;
    }

    // Find review and populate business details and business owner email
    const review = await Review.findById(reviewId).populate({
      path: 'business',
      populate: {
        path: 'owner',
      },
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (review.status !== 'reported') {
      res.status(400).json({ success: false, message: 'This review is not currently reported or is already resolved' });
      return;
    }

    const business = review.business as any;
    const businessName = business?.name || 'Your Business';
    
    // Find email to notify: business owner email or business contact email
    const ownerEmail = business?.owner?.email || business?.email;

    if (action === 'delete') {
      review.status = 'resolved_deleted';
    } else {
      review.status = 'resolved_kept';
    }

    review.adminReply = adminReply.trim();
    await review.save(); // This triggers Mongoose pre/post hooks to update Business avg rating

    // Trigger the email notification
    if (ownerEmail) {
      try {
        await sendReportResolutionEmail(
          ownerEmail,
          businessName,
          review.comment,
          action,
          adminReply.trim()
        );
      } catch (err) {
        console.error('Failed to send report resolution email:', err);
      }
    }

    res.status(200).json({
      success: true,
      message: `Review successfully resolved as: ${action === 'delete' ? 'deleted' : 'kept'}`,
      data: review,
    });
  }
);
