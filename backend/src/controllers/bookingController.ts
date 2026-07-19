import { Request, Response } from 'express';
import Booking from '../models/Booking.js';
import Business from '../models/Business.js';
import DailySummary from '../models/DailySummary.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { triggerBookingWebhook } from '../utils/n8n.js';

// Create Booking
export const createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  booking.status = status;
  await booking.save();

  res.status(200).json({
    success: true,
    message: `Booking status updated to ${status}`,
    data: booking,
  });
});
