import { Request, Response } from 'express';
import Inquiry from '../models/Inquiry.js';
import Business from '../models/Business.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Create inquiry
export const createInquiry = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const { businessId, name, email, phone, subject, message } = req.body;

    if (!businessId || !name || !email || !phone || !subject || !message) {
      res.status(400).json({ success: false, message: 'Please provide all required fields' });
      return;
    }

    if (!businessId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ success: false, message: 'Invalid business ID format' });
      return;
    }

    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    const inquiry = new Inquiry({
      business: businessId,
      inquirer: req.user?.id || null,
      name,
      email,
      phone,
      subject,
      message,
    });

    await inquiry.save();

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: inquiry,
    });
  }
);

// Get inquiries for a business
export const getBusinessInquiries = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const { businessId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Verify user owns the business
    const business = await Business.findById(businessId);
    if (!business || business.owner.toString() !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const filter: any = { business: businessId };
    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const inquiries = await Inquiry.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Inquiry.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: inquiries,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: inquiries.length,
        total_count: total,
      },
    });
  }
);

// Update inquiry status
export const updateInquiryStatus = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const { inquiryId } = req.params;
    const { status, response } = req.body;

    const inquiry = await Inquiry.findById(inquiryId).populate('business');

    if (!inquiry) {
      res.status(404).json({ success: false, message: 'Inquiry not found' });
      return;
    }

    // Verify user owns the business
    if ((inquiry.business as any).owner.toString() !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    inquiry.status = status;
    if (response) {
      inquiry.response = response;
      inquiry.respondedAt = new Date();
    }

    await inquiry.save();

    res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully',
      data: inquiry,
    });
  }
);

// Get user inquiries
export const getUserInquiries = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const inquiries = await Inquiry.find({ inquirer: req.user?.id })
      .populate('business', 'name slug')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Inquiry.countDocuments({ inquirer: req.user?.id });

    res.status(200).json({
      success: true,
      data: inquiries,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: inquiries.length,
        total_count: total,
      },
    });
  }
);
