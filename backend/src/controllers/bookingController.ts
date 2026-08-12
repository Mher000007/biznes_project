import { Request, Response } from 'express';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Business from '../models/Business.js';
import User from '../models/User.js';
import DailySummary from '../models/DailySummary.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { triggerBookingWebhook } from '../utils/n8n.js';

// Create Booking
export const createBooking = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const { businessId, customerName, customerPhone, date, timeSlot, serviceName, totalPrice, notes, locationId } = req.body;

  if (!businessId || !customerName || !customerPhone || !date || !timeSlot || !serviceName || totalPrice === undefined) {
    res.status(400).json({ success: false, message: 'Please provide all required fields' });
    return;
  }

  if (!businessId.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400).json({ success: false, message: 'Invalid business ID format' });
    return;
  }

  const businessExists = await Business.findById(businessId);
  if (!businessExists) {
    res.status(404).json({ success: false, message: 'Business not found' });
    return;
  }

  // Check if date is closed for bookings
  const dStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
  const summaryDoc = await DailySummary.findOne({
    business: businessId,
    date: dStr
  });
  if (summaryDoc && summaryDoc.isClosed) {
    res.status(400).json({ success: false, message: 'This business is closed for bookings on the selected date.' });
    return;
  }

  const qrToken = crypto.randomBytes(8).toString('hex').toUpperCase();

  const booking = new Booking({
    business: businessId,
    customerName,
    customerPhone,
    date: new Date(date),
    timeSlot,
    serviceName,
    totalPrice,
    notes,
    locationId: locationId || undefined,
    status: 'pending',
    qrToken,
  });

  await booking.save();

  // Trigger n8n webhook for booking notification
  const webhookSuccess = await triggerBookingWebhook(booking);
  if (webhookSuccess) {
    booking.webhookTriggered = true;
    await booking.save();
  }

  res.status(201).json({
    success: true,
    message: 'Booking created successfully and notification sent to staff',
    data: booking,
  });
});

// Get Bookings by Business ID
export const getBookingsByBusiness = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const businessId = req.params.businessId;

  // Validate business owner
  const business = await Business.findById(businessId);
  if (!business) {
    res.status(404).json({ success: false, message: 'Business not found' });
    return;
  }

  if (business.owner.toString() !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Not authorized to view bookings for this business' });
    return;
  }

  const bookings = await Booking.find({ business: businessId }).sort({ date: -1, timeSlot: -1 });

  res.status(200).json({
    success: true,
    data: bookings,
  });
});

// Update Booking Status
export const updateBookingStatus = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
    res.status(400).json({ success: false, message: 'Please provide a valid status' });
    return;
  }

  const booking = await Booking.findById(id).populate('business');
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  // Ensure request is made by business owner
  const business = booking.business as any;
  if (business.owner.toString() !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    return;
  }

  const previousStatus = booking.status;
  booking.status = status;
  await booking.save();

  res.status(200).json({
    success: true,
    message: `Booking status updated to ${status}`,
    data: booking,
  });
});

// Delete Booking (For Business Owner)
export const deleteBooking = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const { id } = req.params;
  console.log("DELETE BOOKING REQUEST RECEIVED FOR ID:", id);

  const booking = await Booking.findById(id).populate('business');
  if (!booking) {
    console.log("BOOKING NOT FOUND IN DB:", id);
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  console.log("BOOKING FOUND:", booking._id);

  // Ensure request is made by business owner
  const business = booking.business as any;
  if (!business) {
    console.log("BUSINESS NOT FOUND FOR BOOKING");
    res.status(404).json({ success: false, message: 'Associated business not found' });
    return;
  }
  if (business.owner.toString() !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
    return;
  }

  await booking.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Booking deleted successfully',
  });
});

// Get User Bookings
export const getUserBookings = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  let query: any = {};
  const orConditions = [];

  if (user.phone) {
    const cleanPhone = user.phone.replace(/\D/g, "");
    orConditions.push({ customerPhone: user.phone });
    orConditions.push({ customerPhone: cleanPhone });
    orConditions.push({ customerPhone: new RegExp(cleanPhone, 'i') });
  }

  if (user.name) {
    orConditions.push({ customerName: new RegExp(`^${user.name.trim()}$`, "i") });
  }

  if (orConditions.length > 0) {
    query = { $or: orConditions };
  } else {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const bookings = await Booking.find(query).populate('business', 'name slug logo').sort({ date: -1, timeSlot: -1 });

  res.status(200).json({
    success: true,
    data: bookings,
  });
});

// Verify Booking QR Code
export const verifyBookingQr = asyncHandler(async (req: Request & { user?: any }, res: Response): Promise<void> => {
  const { qrToken } = req.body;
  if (!qrToken) {
    res.status(400).json({ success: false, message: 'Please provide a QR token' });
    return;
  }

  const booking = await Booking.findOne({ qrToken }).populate('business');
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found or invalid QR code' });
    return;
  }

  const business = booking.business as any;
  if (business.owner.toString() !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Not authorized to verify this booking' });
    return;
  }

  if (booking.status === 'completed') {
    res.status(400).json({ success: false, message: 'This booking has already been completed' });
    return;
  }

  const previousStatus = booking.status;
  booking.status = 'completed';
  await booking.save();

  // 1% Cashback Coins Reward logic when business completes booking
  if (booking.totalPrice && booking.totalPrice > 0) {
    const coinsToCredit = Math.floor(booking.totalPrice * 0.01);
    if (coinsToCredit > 0) {
      let customerUser = null;
      if (booking.customerPhone) {
        const cleanPhone = booking.customerPhone.replace(/\D/g, "");
        customerUser = await User.findOne({
          $or: [
            { phone: booking.customerPhone },
            { phone: cleanPhone },
            { phone: `+${cleanPhone}` }
          ]
        });
      }
      if (!customerUser && booking.customerName) {
        customerUser = await User.findOne({ name: new RegExp(`^${booking.customerName.trim()}$`, "i") });
      }

      if (customerUser) {
        customerUser.findyCoins = (customerUser.findyCoins || 0) + coinsToCredit;
        await customerUser.save();
      }
    }
  }

  res.status(200).json({
    success: true,
    message: 'Booking verified and completed successfully',
    data: booking,
  });
});
