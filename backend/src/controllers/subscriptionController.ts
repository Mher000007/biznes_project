import { Request, Response } from 'express';
import Subscription from '../models/Subscription.js';
import Business from '../models/Business.js';
import PromoCode from '../models/PromoCode.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Subscribe or Update Subscription
export const subscribe = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const { businessId, plan } = req.body;

  if (!businessId || !plan || !['starter', 'standard', 'premium'].includes(plan)) {
    res.status(400).json({ success: false, message: 'Please provide valid business ID and subscription plan' });
    return;
  }

  const business = await Business.findById(businessId);
  if (!business) {
    res.status(404).json({ success: false, message: 'Business not found' });
    return;
  }

  // Validate owner
  if (business.owner.toString() !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Not authorized to subscribe this business' });
    return;
  }

  // Determine price and commission rate based on plan
  let price = 0;
  let commissionRate = 7; // Starter (Freemium) defaults

  if (plan === 'standard') {
    price = 20000;
    commissionRate = 2;
  } else if (plan === 'premium') {
    price = 50000;
    commissionRate = 0;
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 1 month duration

  // Find existing subscription or create new
  let subscription = await Subscription.findOne({ business: businessId });

  if (subscription) {
    subscription.plan = plan;
    subscription.price = price;
    subscription.commissionRate = commissionRate;
    subscription.status = 'active';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();
  } else {
    subscription = new Subscription({
      business: businessId,
      plan,
      price,
      commissionRate,
      status: 'active',
      startDate,
      endDate,
    });
    await subscription.save();
  }

  res.status(200).json({
    success: true,
    message: `Subscribed to ${plan} plan successfully`,
    data: subscription,
  });
});

// Get Subscription for Business
export const getSubscription = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const { businessId } = req.params;

  const business = await Business.findById(businessId);
  if (!business) {
    res.status(404).json({ success: false, message: 'Business not found' });
    return;
  }

  // Allow only owner or admin to inspect subscription
  if (business.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  let subscription = await Subscription.findOne({ business: businessId });

  // If no subscription exists, default to starter plan (Freemium)
  if (!subscription) {
    subscription = new Subscription({
      business: businessId,
      plan: 'starter',
      price: 0,
      commissionRate: 7,
      status: 'active',
      startDate: business.createdAt,
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)), // far in future
    });
  }

  res.status(200).json({
    success: true,
    data: subscription,
  });
});

// Activate Promo Code for Business
export const activatePromoCode = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const { businessId, code } = req.body;

  if (!businessId || !code) {
    res.status(400).json({ success: false, message: 'Please provide business ID and promo code' });
    return;
  }

  const business = await Business.findById(businessId);
  if (!business) {
    res.status(404).json({ success: false, message: 'Business not found' });
    return;
  }

  // Verify owner
  if (business.owner.toString() !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Not authorized to configure subscription for this business' });
    return;
  }

  const uppercaseCode = code.trim().toUpperCase();
  const promo = await PromoCode.findOne({ code: uppercaseCode });

  if (!promo) {
    res.status(404).json({ success: false, message: 'Invalid promo code' });
    return;
  }

  if (!promo.isActive) {
    res.status(400).json({ success: false, message: 'Promo code is inactive' });
    return;
  }

  const now = new Date();

  // Validate dates
  if (promo.startDate && new Date(promo.startDate) > now) {
    res.status(400).json({ success: false, message: 'Promo code validity period has not started yet' });
    return;
  }

  if (promo.expiryDate && new Date(promo.expiryDate) < now) {
    res.status(400).json({ success: false, message: 'Promo code has expired' });
    return;
  }

  // Validate total usage limits
  if (promo.maxUses && promo.usesCount >= promo.maxUses) {
    res.status(400).json({ success: false, message: 'Promo code has reached its maximum usage limit' });
    return;
  }

  // Validate business restrictions
  if (promo.restrictedToBusinesses && promo.restrictedToBusinesses.length > 0) {
    const isAllowed = promo.restrictedToBusinesses.some(id => id.toString() === businessId);
    if (!isAllowed) {
      res.status(400).json({ success: false, message: 'Promo code is not valid for this business' });
      return;
    }
  }

  // Prevent double redemption by the same business
  const alreadyRedeemed = promo.redemptions.some(red => red.business.toString() === businessId);
  if (alreadyRedeemed) {
    res.status(400).json({ success: false, message: 'This promo code has already been redeemed by this business' });
    return;
  }

  // Calculate standard price
  let standardPrice = 0;
  if (promo.plan === 'standard') {
    standardPrice = 20000;
  } else if (promo.plan === 'premium') {
    standardPrice = 50000;
  }

  // Calculate final price
  let finalPrice = standardPrice;
  if (promo.discountType === 'free') {
    finalPrice = 0;
  } else if (promo.discountType === 'percent') {
    finalPrice = Math.max(0, standardPrice * (1 - promo.discountValue / 100));
  } else if (promo.discountType === 'amount') {
    finalPrice = Math.max(0, standardPrice - promo.discountValue);
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (promo.durationUnit === 'permanent') {
    endDate.setFullYear(endDate.getFullYear() + 100);
  } else if (promo.durationUnit === 'months') {
    endDate.setMonth(endDate.getMonth() + promo.durationValue);
  } else if (promo.durationUnit === 'days') {
    endDate.setDate(endDate.getDate() + promo.durationValue);
  }

  // Determine commission rate based on target plan
  let commissionRate = 7;
  if (promo.plan === 'standard') commissionRate = 2;
  if (promo.plan === 'premium') commissionRate = 0;

  // Apply subscription
  let subscription = await Subscription.findOne({ business: businessId });
  if (subscription) {
    subscription.plan = promo.plan;
    subscription.price = finalPrice;
    subscription.commissionRate = commissionRate;
    subscription.status = 'active';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    (subscription as any).isGifted = false;
    (subscription as any).giftReason = undefined;
    (subscription as any).promoCode = promo.code;
    await subscription.save();
  } else {
    subscription = new Subscription({
      business: businessId,
      plan: promo.plan,
      price: finalPrice,
      commissionRate,
      status: 'active',
      startDate,
      endDate,
      isGifted: false,
      promoCode: promo.code,
    } as any);
    await subscription.save();
  }

  // Record redemption
  promo.usesCount += 1;
  promo.redemptions.push({
    business: businessId as any,
    user: req.user.id,
    redeemedAt: new Date(),
  });
  await promo.save();

  res.status(200).json({
    success: true,
    message: `Promo code applied successfully! Activated ${promo.plan} plan.`,
    data: subscription,
  });
});
