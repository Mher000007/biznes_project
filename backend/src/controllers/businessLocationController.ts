import { Request, Response } from 'express';
import BusinessLocation from '../models/BusinessLocation.js';
import Business from '../models/Business.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { isValidCity } from '../utils/locationValidator.js';

// @desc    Get all locations for a business
// @route   GET /api/businesses/:businessId/locations
// @access  Public
export const getLocations = asyncHandler(async (req: Request, res: Response) => {
  const { businessId } = req.params;

  const locations = await BusinessLocation.find({ business: businessId }).sort({ isPrimary: -1, createdAt: 1 });

  res.status(200).json({
    success: true,
    count: locations.length,
    data: locations,
  });
});

// @desc    Add a new location
// @route   POST /api/businesses/:businessId/locations
// @access  Private (Owner only)
export const addLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { businessId } = req.params;

  // Check if business exists and user is owner
  const business = await Business.findById(businessId);
  if (!business) {
    res.status(404).json({ success: false, message: 'Business not found' });
    return;
  }

  if (business.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Not authorized to add locations to this business' });
    return;
  }

  // If this is set as primary, unset other primary locations
  if (req.body.isPrimary) {
    await BusinessLocation.updateMany(
      { business: businessId, isPrimary: true },
      { isPrimary: false }
    );
  } else {
    // If it's the first location, make it primary automatically
    const count = await BusinessLocation.countDocuments({ business: businessId });
    if (count === 0) {
      req.body.isPrimary = true;
    }
  }

  if (req.body.city && !isValidCity(req.body.city)) {
    res.status(400).json({ success: false, message: `Invalid city/region selected: ${req.body.city}` });
    return;
  }

  const location = await BusinessLocation.create({
    ...req.body,
    business: businessId,
  });

  // Sync to Business model if primary
  if (location.isPrimary) {
    await Business.findByIdAndUpdate(businessId, {
      address: location.address,
      city: location.city,
      coordinates: location.coordinates,
      phone: location.phone
    });
  }

  res.status(201).json({
    success: true,
    data: location,
  });
});

// @desc    Update a location
// @route   PUT /api/businesses/locations/:id
// @access  Private (Owner only)
export const updateLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let location = await BusinessLocation.findById(id);
  if (!location) {
    res.status(404).json({ success: false, message: 'Location not found' });
    return;
  }

  // Check ownership
  const business = await Business.findById(location.business);
  if (business?.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Not authorized to update this location' });
    return;
  }

  // Handle primary flag changes
  if (req.body.isPrimary && !location.isPrimary) {
    await BusinessLocation.updateMany(
      { business: location.business, isPrimary: true },
      { isPrimary: false }
    );
  }

  if (req.body.city && !isValidCity(req.body.city)) {
    res.status(400).json({ success: false, message: `Invalid city/region selected: ${req.body.city}` });
    return;
  }

  location = await BusinessLocation.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  // Sync to Business model if primary
  if (location && location.isPrimary) {
    await Business.findByIdAndUpdate(location.business, {
      address: location.address,
      city: location.city,
      coordinates: location.coordinates,
      phone: location.phone
    });
  }

  res.status(200).json({
    success: true,
    data: location,
  });
});

// @desc    Delete a location
// @route   DELETE /api/businesses/locations/:id
// @access  Private (Owner only)
export const deleteLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const location = await BusinessLocation.findById(id);
  if (!location) {
    res.status(404).json({ success: false, message: 'Location not found' });
    return;
  }

  // Check ownership
  const business = await Business.findById(location.business);
  if (business?.owner.toString() !== req.user?.id && req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Not authorized to delete this location' });
    return;
  }

  // Check if it's the last location or primary
  if (location.isPrimary) {
    const otherLocation = await BusinessLocation.findOne({
      business: location.business,
      _id: { $ne: location._id }
    });
    
    if (otherLocation) {
      // Reassign primary to another location
      otherLocation.isPrimary = true;
      await otherLocation.save();
    } else {
      // If it's the only location, they shouldn't delete it?
      // Actually, business model holds a fallback primary address. We can allow deletion.
    }
  }

  await location.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
