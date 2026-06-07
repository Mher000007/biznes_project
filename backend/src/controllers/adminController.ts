import { Response } from 'express';
import Review from '../models/Review.js';
import Business from '../models/Business.js';
import Booking from '../models/Booking.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendReportResolutionEmail } from '../utils/emailService.js';

// ─── GET admin aggregate stats ───────────────────────────────────────────────
export const getAdminStats = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const [
      totalBusinesses,
      pendingBusinesses,
      verifiedBusinesses,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      activeSubscriptions,
      totalUsers,
      totalReviews,
      flaggedReviews,
    ] = await Promise.all([
      Business.countDocuments(),
      Business.countDocuments({ verified: false }),
      Business.countDocuments({ verified: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Subscription.countDocuments({ status: 'active' }),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Review.countDocuments(),
      Review.countDocuments({ status: 'reported' }),
    ]);

    const subRevenue = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);
    const totalRevenue = subRevenue[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalBusinesses,
        pendingBusinesses,
        verifiedBusinesses,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        activeSubscriptions,
        totalUsers,
        totalReviews,
        flaggedReviews,
        totalRevenue,
      },
    });
  }
);

// ─── GET all businesses ──────────────────────────────────────────────────────
export const getBusinesses = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const businesses = await Business.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'name email')
      .populate('category', 'name slug')
      .lean();
    res.status(200).json({ success: true, data: businesses });
  }
);

// ─── APPROVE a business ──────────────────────────────────────────────────────
export const approveBusiness = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const business = await Business.findByIdAndUpdate(
      id,
      { verified: true, active: true },
      { new: true }
    );
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }
    res.status(200).json({ success: true, data: business });
  }
);

// ─── REJECT / SUSPEND a business ────────────────────────────────────────────
export const rejectBusiness = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const business = await Business.findByIdAndUpdate(
      id,
      { verified: false, active: false },
      { new: true }
    );
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }
    res.status(200).json({ success: true, data: business });
  }
);

// ─── DELETE a business and all related data ──────────────────────────────────
export const deleteBusiness = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const business = await Business.findById(id);
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }
    await Review.deleteMany({ business: id });
    await Booking.deleteMany({ business: id });
    await Subscription.deleteOne({ business: id });
    await Business.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Business and all related data deleted' });
  }
);

// ─── GET all bookings ────────────────────────────────────────────────────────
export const getBookings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate('business', 'name email slug')
      .lean();
    res.status(200).json({ success: true, data: bookings });
  }
);

// ─── DELETE a booking ────────────────────────────────────────────────────────
export const deleteBooking = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Booking deleted' });
  }
);

// ─── GET all subscriptions ───────────────────────────────────────────────────
export const getSubscriptions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const subs = await Subscription.find()
      .sort({ createdAt: -1 })
      .populate('business', 'name email slug')
      .lean();
    res.status(200).json({ success: true, data: subs });
  }
);

// ─── DELETE a subscription ───────────────────────────────────────────────────
export const deleteSubscription = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const sub = await Subscription.findByIdAndDelete(id);
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Subscription deleted' });
  }
);

// ─── GET all reported reviews ────────────────────────────────────────────────
export const getReportedReviews = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const reports = await Review.find({ status: 'reported' })
      .sort({ reportedAt: -1 })
      .populate({
        path: 'business',
        select: 'name email owner',
        populate: { path: 'owner', select: 'name email' },
      })
      .populate('author', 'name email avatar');
    res.status(200).json({ success: true, data: reports });
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
      res.status(400).json({ success: false, message: 'Invalid action' });
      return;
    }
    if (!adminReply || adminReply.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Admin reply must be at least 5 characters' });
      return;
    }

    const review = await Review.findById(reviewId).populate({
      path: 'business',
      populate: { path: 'owner' },
    });
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }
    if (review.status !== 'reported') {
      res.status(400).json({ success: false, message: 'Review is not in reported state' });
      return;
    }

    const business = review.business as any;
    const ownerEmail = business?.owner?.email || business?.email;

    review.status = action === 'delete' ? 'resolved_deleted' : 'resolved_kept';
    review.adminReply = adminReply.trim();
    await review.save();

    if (ownerEmail) {
      try {
        await sendReportResolutionEmail(ownerEmail, business?.name || '', review.comment, action, adminReply.trim());
      } catch (err) {
        console.error('Failed to send resolution email:', err);
      }
    }

    res.status(200).json({
      success: true,
      message: `Review ${action === 'delete' ? 'deleted' : 'kept'}`,
      data: review,
    });
  }
);

// ─── GET all users ───────────────────────────────────────────────────────────
export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('-password')
      .lean();
    res.status(200).json({ success: true, data: users });
  }
);

// ─── DELETE a user ───────────────────────────────────────────────────────────
export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (user.role === 'admin') {
      res.status(400).json({ success: false, message: 'Cannot delete admin accounts' });
      return;
    }
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'User deleted' });
  }
);
