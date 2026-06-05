import { Request, Response } from 'express';
import Subscription from '../models/Subscription.js';
import Business from '../models/Business.js';
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
