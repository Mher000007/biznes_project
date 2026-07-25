import { Request, Response } from 'express';
import ExchangeOffer from '../models/ExchangeOffer.js';
import Business from '../models/Business.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

// @desc    Get all exchange offers (for the public exchange page)
// @route   GET /api/exchange-offers
// @access  Public
export const getExchangeOffers = async (req: Request, res: Response) => {
  try {
    const offers = await ExchangeOffer.find({ isActive: true })
      .populate('business', 'name logo category')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

import mongoose from 'mongoose';

// @desc    Get exchange offers for a specific business
// @route   GET /api/exchange-offers/business/:businessId
// @access  Public
export const getBusinessExchangeOffers = async (req: Request & { user?: any }, res: Response) => {
  try {
    let businessId = req.params.businessId;

    if (businessId === 'me') {
      const biz = await Business.findOne({ owner: req.user?.id });
      if (!biz) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      businessId = biz._id.toString();
    } else if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const offers = await ExchangeOffer.find({ business: businessId }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new exchange offer
// @route   POST /api/exchange-offers
// @access  Private
export const createExchangeOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { businessId, title, description, category, cost, totalQuantity, isActive, image, imageUrl } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    if (business.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to add an exchange offer to this business' });
    }

    // Check Plan Limits (Pro: max 3 offers, Premium: unlimited)
    const sub = await Subscription.findOne({ business: businessId, status: 'active' });
    const userPlan = sub?.plan || (business as any).plan || 'starter';

    if (userPlan === 'starter' || userPlan === 'start' || userPlan === 'free') {
      return res.status(403).json({
        success: false,
        error: 'Findy Coin Offers feature is locked on the Start plan. Please upgrade to Pro or Premium.'
      });
    }

    if (userPlan === 'pro') {
      const existingOfferCount = await ExchangeOffer.countDocuments({ business: businessId });
      if (existingOfferCount >= 3) {
        return res.status(403).json({
          success: false,
          error: 'Pro փաթեթի դեպքում կարող եք հրապարակել առավելագույնը 3 առաջարկ: Անսահմանափակ առաջարկների համար թարմացրեք փաթեթը Premium-ի:'
        });
      }
    }

    const offer = await ExchangeOffer.create({
      business: businessId,
      title,
      description,
      category,
      cost,
      totalQuantity,
      isActive: isActive !== undefined ? isActive : true,
      image: image || imageUrl || '',
      imageUrl: imageUrl || image || '',
    });

    res.status(201).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update exchange offer
// @route   PUT /api/exchange-offers/:id
// @access  Private
export const updateExchangeOffer = async (req: AuthRequest, res: Response) => {
  try {
    let offer = await ExchangeOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    }

    const business = await Business.findById(offer.business);
    if (business?.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to update this offer' });
    }

    offer = await ExchangeOffer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete exchange offer
// @route   DELETE /api/exchange-offers/:id
// @access  Private
export const deleteExchangeOffer = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await ExchangeOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    }

    const business = await Business.findById(offer.business);
    if (business?.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this offer' });
    }

    await offer.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Toggle save/like on an exchange offer
// @route   POST /api/exchange-offers/:id/toggle-save
// @access  Private
export const toggleSaveExchangeOffer = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await ExchangeOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const index = offer.savedBy?.findIndex((id) => id.toString() === userId.toString()) ?? -1;
    if (index === -1) {
      offer.savedBy = offer.savedBy || [];
      offer.savedBy.push(userId as any);
    } else {
      offer.savedBy.splice(index, 1);
    }

    await offer.save();

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Claim/Redeem an exchange offer
// @route   POST /api/exchange-offers/:id/claim
// @access  Private
export const claimExchangeOffer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const offerId = req.params.id;
    if (!offerId || !offerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid offer ID format' });
    }

    const offer = await ExchangeOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    }

    if (!offer.isActive) {
      return res.status(400).json({ success: false, error: 'Այս առաջարկը ակտիվ չէ:' });
    }

    if (offer.claimedQuantity >= offer.totalQuantity) {
      return res.status(400).json({ success: false, error: 'Այս առաջարկի բոլոր օրինակները արդեն սպառվել են:' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const currentCoins = user.findyCoins || 0;
    if (currentCoins < offer.cost) {
      return res.status(400).json({
        success: false,
        error: `Դուք չունեք բավարար Findy Coins (${offer.cost} Coins) այս առաջարկը ստանալու համար: Ձեր մնացորդը: ${currentCoins} Coins:`
      });
    }

    // Deduct coins and increment claimedQuantity
    user.findyCoins = currentCoins - offer.cost;
    await user.save();

    offer.claimedQuantity += 1;
    await offer.save();

    res.status(200).json({
      success: true,
      message: 'Փոխանակումը հաջողությամբ կատարվեց:',
      data: {
        offerId: offer._id,
        claimedQuantity: offer.claimedQuantity,
        totalQuantity: offer.totalQuantity,
        remainingCoins: user.findyCoins,
      }
    });
  } catch (error) {
    console.error('Error claiming exchange offer:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
