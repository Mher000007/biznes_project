import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Business from '../models/Business.js';
import Category from '../models/Category.js';
import Subscription from '../models/Subscription.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { triggerOnboardingWebhook } from '../utils/n8n.js';

// Get all businesses
export const getBusinesses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { category, city, search, featured, maxPrice, premiumOnly, page = 1, limit = 10 } = req.query;

  const filter: any = { active: true }; // Allow unverified for now during dev, or verified: true. Let's keep active: true for easy developer testing of onboarded businesses!

  if (premiumOnly === 'true') {
    const premiumSubs = await Subscription.find({ plan: 'premium', status: 'active' }).select('business');
    const premiumBizIds = premiumSubs.map(sub => sub.business);
    filter._id = { $in: premiumBizIds };
  }

  if (category) {
    if (category.toString().match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const foundCategory = await Category.findOne({ slug: category.toString().toLowerCase() });
      if (foundCategory) {
        filter.category = foundCategory._id;
      } else {
        filter.category = new mongoose.Types.ObjectId(); // force fail if category slug not found
      }
    }
  }

  if (city) {
    filter.city = new RegExp(`^${city}$`, 'i');
  }

  if (featured) {
    filter.featured = featured === 'true';
  }

  if (maxPrice) {
    const priceLimit = parseFloat(maxPrice as string);
    if (!isNaN(priceLimit)) {
      filter.$or = [
        { 'services.price': { $lte: priceLimit } },
        { 'menu.price': { $lte: priceLimit } }
      ];
    }
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    const searchConditions = [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
    ];
    
    if (filter.$or) {
      // If we already have a price filter, combine them with $and
      filter.$and = [
        { $or: filter.$or },
        { $or: searchConditions }
      ];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  const businesses = await Business.find(filter)
    .populate('category', 'name slug icon')
    .populate('owner', 'name email')
    .skip(skip)
    .limit(limitNum)
    .sort({ featured: -1, createdAt: -1 });

  const total = await Business.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: businesses,
    pagination: {
      current: pageNum,
      total: Math.ceil(total / limitNum),
      count: businesses.length,
      total_count: total,
    },
  });
});

// Get business by ID
export const getBusinessById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const business = await Business.findById(req.params.id)
    .populate('category')
    .populate('owner', 'name email phone');

  if (!business) {
    res.status(404).json({ success: false, message: 'Business not found' });
    return;
  }

  res.status(200).json({
    success: true,
    data: business,
  });
});

// Get business by slug
export const getBusinessBySlug = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const business = await Business.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('category')
      .populate('owner', 'name email phone');

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: business,
    });
  }
);

// Create business
export const createBusiness = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const {
      name,
      description,
      category,
      email,
      phone,
      address,
      city,
      country,
      website,
      services,
      menu,
      highlights,
      layoutConfig,
      coordinates,
      latitude,
      longitude,
    } = req.body;

    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!category) missingFields.push('category');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');
    if (!address) missingFields.push('address');
    if (!city) missingFields.push('city');
    if (!country) missingFields.push('country');

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Please provide all required fields. Missing: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Resolve category ObjectId if needed
    let categoryId = category;
    if (!mongoose.Types.ObjectId.isValid(category)) {
      // Look up by slug directly
      let foundCategory = await Category.findOne({ slug: category });
      if (!foundCategory) {
        // Try parsing slug from static format like "cat-tech" -> "technology"
        let cleanSlug = category.replace(/^cat-/, '').toLowerCase();
        const staticSlugMap: Record<string, string> = {
          'tech': 'technology',
          'agri': 'agriculture',
        };
        if (staticSlugMap[cleanSlug]) {
          cleanSlug = staticSlugMap[cleanSlug];
        }
        foundCategory = await Category.findOne({ slug: cleanSlug });
      }

      if (foundCategory) {
        categoryId = foundCategory._id;
      } else {
        res.status(400).json({
          success: false,
          message: `Category '${category}' not found in the database. Please ensure categories are seeded.`,
        });
        return;
      }
    }

    const finalCoordinates = coordinates || (latitude !== undefined && longitude !== undefined ? { latitude: Number(latitude), longitude: Number(longitude) } : undefined);

    const business = new Business({
      name,
      description,
      category: categoryId,
      owner: req.user?.id,
      email,
      phone,
      address,
      city,
      country,
      website,
      services,
      menu,
      highlights,
      layoutConfig,
      coordinates: finalCoordinates,
    });

    await business.save();

    // Increment business count in category
    await Category.findByIdAndUpdate(categoryId, { $inc: { businessCount: 1 } });

    // Trigger n8n webhook for vendor registration request
    await triggerOnboardingWebhook(business);

    res.status(201).json({
      success: true,
      message: 'Business onboarding completed. Approval request routed to administrator.',
      data: business,
    });
  }
);

// Update business
export const updateBusiness = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    let business = await Business.findById(req.params.id);

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    // Check if user is the owner
    if (business.owner.toString() !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Not authorized to update this business' });
      return;
    }

    const updateData = { ...req.body };

    // Resolve category ObjectId if needed
    if (updateData.category) {
      if (!mongoose.Types.ObjectId.isValid(updateData.category)) {
        // Look up by slug directly
        let foundCategory = await Category.findOne({ slug: updateData.category });
        if (!foundCategory) {
          // Try parsing slug from static format like "cat-tech" -> "technology"
          let cleanSlug = updateData.category.replace(/^cat-/, '').toLowerCase();
          const staticSlugMap: Record<string, string> = {
            'tech': 'technology',
            'agri': 'agriculture',
          };
          if (staticSlugMap[cleanSlug]) {
            cleanSlug = staticSlugMap[cleanSlug];
          }
          foundCategory = await Category.findOne({ slug: cleanSlug });
        }

        if (foundCategory) {
          updateData.category = foundCategory._id;
        } else {
          res.status(400).json({
            success: false,
            message: `Category '${updateData.category}' not found in the database. Please ensure categories are seeded.`,
          });
          return;
        }
      }
    }

    if (!updateData.coordinates && updateData.latitude !== undefined && updateData.longitude !== undefined) {
      updateData.coordinates = {
        latitude: Number(updateData.latitude),
        longitude: Number(updateData.longitude)
      };
    }

    business = await Business.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      data: business,
    });
  }
);

// Delete business
export const deleteBusiness = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const business = await Business.findById(req.params.id);

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    // Check if user is the owner
    if (business.owner.toString() !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this business' });
      return;
    }

    await Business.findByIdAndDelete(req.params.id);

    // Decrement business count in category
    await Category.findByIdAndUpdate(business.category, { $inc: { businessCount: -1 } });

    res.status(200).json({
      success: true,
      message: 'Business deleted successfully',
    });
  }
);

// Get my businesses
export const getMyBusinesses = asyncHandler(
  async (req: Request & { user?: any }, res: Response): Promise<void> => {
    const businesses = await Business.find({ owner: req.user?.id })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: businesses,
    });
  }
);

// Rate business
export const rateBusiness = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { rating } = req.body;
    if (rating === undefined || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5' });
      return;
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    const currentReviewCount = business.reviewCount || 0;
    const currentRating = business.rating || 0;

    const newReviewCount = currentReviewCount + 1;
    const newRating = ((currentRating * currentReviewCount) + rating) / newReviewCount;

    business.rating = Math.round(newRating * 10) / 10;
    business.reviewCount = newReviewCount;

    await business.save();

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: business.rating,
        reviewCount: business.reviewCount,
      },
    });
  }
);
