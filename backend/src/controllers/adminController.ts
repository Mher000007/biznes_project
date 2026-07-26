import { Response } from 'express';
import Review from '../models/Review.js';
import Business from '../models/Business.js';
import Booking from '../models/Booking.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import PromoCode from '../models/PromoCode.js';
import SubscriptionGift from '../models/SubscriptionGift.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import SiteSettings from '../models/SiteSettings.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendReportResolutionEmail } from '../utils/emailService.js';

// ─── GET admin aggregate stats ───────────────────────────────────────────────
export const getAdminStats = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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
        Business.countDocuments().catch(() => 0),
        Business.countDocuments({ verified: false }).catch(() => 0),
        Business.countDocuments({ verified: true }).catch(() => 0),
        Booking.countDocuments().catch(() => 0),
        Booking.countDocuments({ status: 'confirmed' }).catch(() => 0),
        Booking.countDocuments({ status: 'cancelled' }).catch(() => 0),
        Subscription.countDocuments({ status: 'active' }).catch(() => 0),
        User.countDocuments({ role: { $ne: 'admin' } }).catch(() => 0),
        Review.countDocuments().catch(() => 0),
        Review.countDocuments({ status: 'reported' }).catch(() => 0),
      ]);

      let totalRevenue = 0;
      try {
        const subRevenue = await Subscription.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: null, total: { $sum: '$price' } } },
        ]);
        totalRevenue = subRevenue[0]?.total || 0;
      } catch (e) {}

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
    } catch (err) {
      console.error('Error in getAdminStats:', err);
      res.status(200).json({
        success: true,
        data: {
          totalBusinesses: 0,
          pendingBusinesses: 0,
          verifiedBusinesses: 0,
          totalBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          activeSubscriptions: 0,
          totalUsers: 0,
          totalReviews: 0,
          flaggedReviews: 0,
          totalRevenue: 0,
        },
      });
    }
  }
);

// ─── GET all businesses ──────────────────────────────────────────────────────
export const getBusinesses = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const businesses = await Business.find()
        .sort({ createdAt: -1 })
        .populate({ path: 'owner', select: 'name email username plainPassword phone contactEmail' })
        .populate('category', 'name slug')
        .lean();
      res.status(200).json({ success: true, data: businesses || [] });
    } catch (err) {
      console.error('Error in getBusinesses:', err);
      res.status(200).json({ success: true, data: [] });
    }
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

// ─── SEND NOTIFICATION ───────────────────────────────────────────────────────
export const sendNotification = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, message, userIds } = req.body;

    if (!title || !message || !userIds || !Array.isArray(userIds)) {
      res.status(400).json({ success: false, message: 'Please provide title, message, and userIds array' });
      return;
    }

    const isBroadcast = userIds.includes('all');
    
    const notification = new Notification({
      title,
      message,
      recipients: isBroadcast ? [] : userIds,
      broadcast: isBroadcast,
      readBy: [],
    });

    await notification.save();

    const audit = new AuditLog({
      action: 'SEND_NOTIFICATION',
      performedBy: req.user?.id,
      targetType: 'Notification',
      targetId: notification._id,
      details: { title, broadcast: isBroadcast, recipientCount: isBroadcast ? 'all' : userIds.length },
    });
    await audit.save();

    res.status(201).json({ success: true, message: 'Notification sent successfully', data: notification });
  }
);

// ─── TOP UP USER FINDY COINS ───────────────────────────────────────────────────
export const topUpUserCoins = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { amount, action } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      res.status(400).json({ success: false, message: 'Please enter a valid positive coin amount' });
      return;
    }

    let currentCoins = user.findyCoins || 0;
    if (action === 'set') {
      currentCoins = numAmount;
    } else if (action === 'subtract') {
      currentCoins = Math.max(0, currentCoins - numAmount);
    } else {
      // default 'add'
      currentCoins += numAmount;
    }

    user.findyCoins = currentCoins;
    await user.save();

    // Log audit action
    const audit = new AuditLog({
      action: 'TOP_UP_COINS',
      performedBy: req.user?.id,
      targetType: 'User',
      targetId: user._id,
      details: { amount: numAmount, action, newTotal: currentCoins },
    });
    await audit.save();

    res.status(200).json({
      success: true,
      message: `Successfully updated ${user.name}'s coins to ${currentCoins.toLocaleString()} Coins`,
      data: { userId: user._id, findyCoins: currentCoins },
    });
  }
);

// ─── GET hero carousel images (public) ───────────────────────────────────────
export const getHeroImages = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const setting = await SiteSettings.findOne({ key: 'heroImages' });
      const images: string[] = setting ? (setting.value as string[]) : [];
      res.status(200).json({ success: true, data: images });
    } catch (err) {
      res.status(200).json({ success: true, data: [] });
    }
  }
);

// ─── UPDATE hero carousel images (admin only) ─────────────────────────────────
export const updateHeroImages = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { images } = req.body;
    if (!Array.isArray(images)) {
      res.status(400).json({ success: false, message: 'images must be an array of URLs' });
      return;
    }
    // Limit to 12 images
    const capped = images.slice(0, 12);
    await SiteSettings.findOneAndUpdate(
      { key: 'heroImages' },
      { key: 'heroImages', value: capped },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, data: capped });
  }
);
