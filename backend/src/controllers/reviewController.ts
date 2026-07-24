import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Review from '../models/Review.js';
import Business from '../models/Business.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// ─── GET reviews for a business ──────────────────────────────────────────────
export const getReviews = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { businessId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    if (!businessId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ success: false, message: 'Invalid business ID' });
      return;
    }

    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    // Optionally authenticate request to check if user is the business owner or admin
    let requesterId: string | undefined = undefined;
    let requesterRole: string | undefined = undefined;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as any;
        requesterId = decoded.id;
        requesterRole = decoded.role;
      } catch (err) {
        // ignore invalid token for public view
      }
    }

    const isOwnerOrAdmin = (requesterId && (business.owner.toString() === requesterId)) || (requesterRole === 'admin');

    const query: any = { business: businessId };
    if (!isOwnerOrAdmin) {
      query.status = { $ne: 'resolved_deleted' };
    }

    const matchQuery = {
      ...query,
      business: new mongoose.Types.ObjectId(businessId)
    };

    const [reviews, total, distributionRaw] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar'),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ])
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distributionRaw.forEach((item: any) => {
      if (item._id >= 1 && item._id <= 5) {
        distribution[item._id as 1 | 2 | 3 | 4 | 5] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: reviews,
      distribution,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: reviews.length,
        total_count: total,
      },
    });
  }
);

// ─── CREATE review ────────────────────────────────────────────────────────────
export const createReview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { businessId } = req.params;
    const { rating, comment, image, images, videos, authorName } = req.body;

    // Validate business ID format
    if (!businessId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ success: false, message: 'Invalid business ID' });
      return;
    }

    // Validate inputs
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5 || !Number.isInteger(parsedRating)) {
      res.status(400).json({ success: false, message: 'Rating must be a whole number between 1 and 5' });
      return;
    }

    if (!comment || typeof comment !== 'string') {
      res.status(400).json({ success: false, message: 'Comment is required' });
      return;
    }

    const trimmed = comment.trim();
    if (trimmed.length < 10) {
      res.status(400).json({ success: false, message: 'Comment must be at least 10 characters' });
      return;
    }
    if (trimmed.length > 1000) {
      res.status(400).json({ success: false, message: 'Comment cannot exceed 1000 characters' });
      return;
    }

    // Check business exists
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    // Try optional authentication manually
    let userId: string | undefined = undefined;
    let userName: string | undefined = undefined;

    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as any;
        userId = decoded.id;
        userName = decoded.name;
      } catch (err) {
        // ignore invalid token for optional auth
      }
    }

    let resolvedAuthorName = '';

    if (userId) {
      // Prevent owner from reviewing their own business
      if (business.owner.toString() === userId) {
        res.status(403).json({ success: false, message: 'You cannot review your own business' });
        return;
      }

      // Check for duplicate (1 review per user per business) - update existing review if present
      const existing = await Review.findOne({
        business: businessId,
        author: userId,
      });

      resolvedAuthorName = userName || 'Anonymous';

      if (existing) {
        existing.rating = parsedRating;
        existing.comment = trimmed;
        if (Array.isArray(images)) existing.images = images;
        if (Array.isArray(videos)) existing.videos = videos;
        existing.authorName = resolvedAuthorName;
        existing.createdAt = new Date();
        await existing.save();

        // Recalculate business average rating
        const stats = await Review.aggregate([
          { $match: { business: new mongoose.Types.ObjectId(businessId) } },
          { $group: { _id: '$business', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
        ]);
        business.rating = Math.round(stats[0].avgRating * 10) / 10;
        business.reviewCount = stats[0].nRating;
        await business.save();

        res.status(200).json({
          success: true,
          message: 'Your review has been updated successfully',
          data: existing,
        });
        return;
      }
    } else {
      // Guest validation
      if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 2) {
        res.status(400).json({ success: false, message: 'Please provide your name (minimum 2 characters)' });
        return;
      }
      if (authorName.trim().length > 50) {
        res.status(400).json({ success: false, message: 'Name cannot exceed 50 characters' });
        return;
      }
      resolvedAuthorName = authorName.trim();
    }

    const review = await Review.create({
      business: businessId,
      author: userId || undefined,
      authorName: resolvedAuthorName,
      rating: parsedRating,
      comment: trimmed,
      image: image || (images && images.length > 0 ? images[0] : undefined),
      images: images || [],
      videos: videos || [],
    });

    if (userId) {
      await review.populate('author', 'name avatar');
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  }
);

// ─── DELETE review (owner of review or admin) ─────────────────────────────────
export const deleteReview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { reviewId } = req.params;

    if (!reviewId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ success: false, message: 'Invalid review ID' });
      return;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    const isOwner = review.author ? review.author.toString() === req.user?.id : false;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
      return;
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  }
);

// ─── MARK review as helpful ───────────────────────────────────────────────────
export const markHelpful = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { reviewId } = req.params;

    if (!reviewId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ success: false, message: 'Invalid review ID' });
      return;
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { helpfulCount: review.helpfulCount },
    });
  }
);

// ─── REPORT review ───────────────────────────────────────────────────────────
export const reportReview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { businessId, reviewId } = req.params;
    const { reportedReason } = req.body;

    if (!businessId.match(/^[0-9a-fA-F]{24}$/) || !reviewId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    if (!reportedReason || typeof reportedReason !== 'string' || reportedReason.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Reported reason must be at least 5 characters' });
      return;
    }

    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    // Only business owner or admin can report reviews
    const isOwner = business.owner.toString() === req.user?.id;
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Only the business owner can report reviews' });
      return;
    }

    const review = await Review.findOne({ _id: reviewId, business: businessId });
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found for this business' });
      return;
    }

    if (review.status === 'reported') {
      res.status(400).json({ success: false, message: 'Review is already under review' });
      return;
    }

    review.status = 'reported';
    review.reportedReason = reportedReason.trim();
    review.reportedAt = new Date();

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review reported successfully',
      data: review,
    });
  }
);

// ─── GET all reviews globally (e.g. for homepage review feed) ─────────────────
export const getAllReviews = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ status: { $ne: 'resolved_deleted' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar')
      .populate('business', 'name slug address city images');

    res.status(200).json({
      success: true,
      data: reviews,
    });
  }
);
