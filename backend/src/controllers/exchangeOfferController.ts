import { Request, Response } from 'express';
import ExchangeOffer from '../models/ExchangeOffer.js';
import Business from '../models/Business.js';
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
    const { businessId, title, description, category, cost, totalQuantity, isActive } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    if (business.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to add an exchange offer to this business' });
    }

    const offer = await ExchangeOffer.create({
      business: businessId,
      title,
      description,
      category,
      cost,
      totalQuantity,
      isActive: isActive !== undefined ? isActive : true,
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
