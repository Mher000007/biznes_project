import { Response } from 'express';
import Review from '../models/Review.js';
import Business from '../models/Business.js';
import Booking from '../models/Booking.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import PromoCode from '../models/PromoCode.js';
import SubscriptionGift from '../models/SubscriptionGift.js';
import AuditLog from '../models/AuditLog.js';
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

// ─── GIFT SUBSCRIPTION ────────────────────────────────────────────────────────
export const giftSubscription = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: businessId } = req.params;
    const { plan, durationValue, durationUnit, reason, actionType } = req.body;

    if (!plan || !['starter', 'standard', 'premium'].includes(plan)) {
      res.status(400).json({ success: false, message: 'Invalid plan selected' });
      return;
    }
    if (!durationValue || isNaN(Number(durationValue)) || Number(durationValue) <= 0) {
      if (durationUnit !== 'permanent') {
        res.status(400).json({ success: false, message: 'Invalid duration value' });
        return;
      }
    }
    if (!durationUnit || !['days', 'months', 'permanent'].includes(durationUnit)) {
      res.status(400).json({ success: false, message: 'Invalid duration unit' });
      return;
    }
    if (!reason || reason.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Please provide a valid reason (min 5 chars)' });
      return;
    }

    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    // Find active subscription
    const existingSub = await Subscription.findOne({ business: businessId });
    const isPaidActive = existingSub && existingSub.plan !== 'starter' && existingSub.status === 'active' && new Date(existingSub.endDate) > new Date();

    const finalActionType = isPaidActive ? actionType : 'create';

    // Calculate dates
    const startDate = finalActionType === 'extend' && existingSub ? new Date(existingSub.endDate) : new Date();
    let endDate = new Date(startDate);

    if (durationUnit === 'permanent') {
      endDate.setFullYear(endDate.getFullYear() + 100); // 100 years
    } else if (durationUnit === 'months') {
      endDate.setMonth(endDate.getMonth() + Number(durationValue));
    } else if (durationUnit === 'days') {
      endDate.setDate(endDate.getDate() + Number(durationValue));
    }

    // Default commission rates based on plan type
    let commissionRate = 7;
    if (plan === 'standard') commissionRate = 2;
    if (plan === 'premium') commissionRate = 0;

    let subscription = existingSub;
    if (subscription) {
      subscription.plan = plan;
      subscription.price = 0; // Gifted has price = 0
      subscription.commissionRate = commissionRate;
      subscription.status = 'active';
      subscription.startDate = finalActionType === 'extend' ? subscription.startDate : startDate;
      subscription.endDate = endDate;
      (subscription as any).isGifted = true;
      (subscription as any).giftReason = reason.trim();
      (subscription as any).promoCode = undefined;
      await subscription.save();
    } else {
      subscription = new Subscription({
        business: businessId,
        plan,
        price: 0,
        commissionRate,
        status: 'active',
        startDate,
        endDate,
        isGifted: true,
        giftReason: reason.trim(),
      } as any);
      await subscription.save();
    }

    // Log the Gift
    const giftLog = new SubscriptionGift({
      business: businessId,
      plan,
      durationValue: durationUnit === 'permanent' ? 99 : Number(durationValue),
      durationUnit,
      startDate,
      endDate,
      reason: reason.trim(),
      giftedBy: req.user?.id,
      actionType: finalActionType,
    });
    await giftLog.save();

    // Log audit action
    const audit = new AuditLog({
      action: 'GIFT_SUBSCRIPTION',
      performedBy: req.user?.id,
      targetType: 'Business',
      targetId: businessId,
      details: {
        plan,
        durationValue,
        durationUnit,
        reason: reason.trim(),
        giftId: giftLog._id,
      },
    });
    await audit.save();

    res.status(200).json({
      success: true,
      message: `Successfully gifted ${plan} plan to ${business.name}`,
      data: subscription,
    });
  }
);

// ─── GET GIFT HISTORY ────────────────────────────────────────────────────────
export const getSubscriptionGifts = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const gifts = await SubscriptionGift.find()
      .sort({ createdAt: -1 })
      .populate('business', 'name email slug')
      .populate('giftedBy', 'name email')
      .lean();

    res.status(200).json({ success: true, data: gifts });
  }
);

// ─── GET ALL PROMO CODES ─────────────────────────────────────────────────────
export const getPromoCodes = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const promos = await PromoCode.find()
      .sort({ createdAt: -1 })
      .populate('restrictedToBusinesses', 'name slug')
      .lean();

    res.status(200).json({ success: true, data: promos });
  }
);

// ─── CREATE PROMO CODE ───────────────────────────────────────────────────────
export const createPromoCode = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      code, plan, discountType, discountValue, durationValue, durationUnit,
      maxUses, startDate, expiryDate, restrictedToBusinesses
    } = req.body;

    if (!code || code.trim().length < 3) {
      res.status(400).json({ success: false, message: 'Promo code must be at least 3 characters' });
      return;
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await PromoCode.findOne({ code: uppercaseCode });
    if (existing) {
      res.status(400).json({ success: false, message: 'Promo code already exists' });
      return;
    }

    if (!plan || !['starter', 'standard', 'premium'].includes(plan)) {
      res.status(400).json({ success: false, message: 'Invalid target plan' });
      return;
    }

    if (!discountType || !['percent', 'amount', 'free'].includes(discountType)) {
      res.status(400).json({ success: false, message: 'Invalid discount type' });
      return;
    }

    const parsedDiscountValue = discountType === 'free' ? 0 : Number(discountValue);
    if (discountType !== 'free' && (isNaN(parsedDiscountValue) || parsedDiscountValue < 0)) {
      res.status(400).json({ success: false, message: 'Invalid discount value' });
      return;
    }

    const parsedDurationValue = Number(durationValue);
    if (isNaN(parsedDurationValue) || parsedDurationValue <= 0) {
      res.status(400).json({ success: false, message: 'Invalid duration value' });
      return;
    }

    if (!durationUnit || !['days', 'months', 'permanent'].includes(durationUnit)) {
      res.status(400).json({ success: false, message: 'Invalid duration unit' });
      return;
    }

    const promo = new PromoCode({
      code: uppercaseCode,
      plan,
      discountType,
      discountValue: parsedDiscountValue,
      durationValue: parsedDurationValue,
      durationUnit,
      maxUses: maxUses ? Number(maxUses) : null,
      startDate: startDate ? new Date(startDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      restrictedToBusinesses: restrictedToBusinesses || [],
    });

    await promo.save();

    // Log audit action
    const audit = new AuditLog({
      action: 'CREATE_PROMO',
      performedBy: req.user?.id,
      targetType: 'PromoCode',
      targetId: promo._id,
      details: { code: uppercaseCode, plan, discountType },
    });
    await audit.save();

    res.status(201).json({ success: true, message: 'Promo code created successfully', data: promo });
  }
);

// ─── TOGGLE PROMO CODE STATUS ────────────────────────────────────────────────
export const togglePromoCode = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const promo = await PromoCode.findById(id);

    if (!promo) {
      res.status(404).json({ success: false, message: 'Promo code not found' });
      return;
    }

    promo.isActive = !promo.isActive;
    await promo.save();

    // Log audit action
    const audit = new AuditLog({
      action: promo.isActive ? 'ACTIVATE_PROMO' : 'DEACTIVATE_PROMO',
      performedBy: req.user?.id,
      targetType: 'PromoCode',
      targetId: promo._id,
      details: { code: promo.code },
    });
    await audit.save();

    res.status(200).json({ success: true, message: `Promo code ${promo.isActive ? 'activated' : 'deactivated'}`, data: promo });
  }
);

// ─── DELETE PROMO CODE ───────────────────────────────────────────────────────
export const deletePromoCode = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const promo = await PromoCode.findById(id);

    if (!promo) {
      res.status(404).json({ success: false, message: 'Promo code not found' });
      return;
    }

    await PromoCode.findByIdAndDelete(id);

    // Log audit action
    const audit = new AuditLog({
      action: 'DELETE_PROMO',
      performedBy: req.user?.id,
      targetType: 'PromoCode',
      targetId: id as any,
      details: { code: promo.code },
    });
    await audit.save();

    res.status(200).json({ success: true, message: 'Promo code deleted successfully' });
  }
);
