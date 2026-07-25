import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Business from '../models/Business.js';
import Category from '../models/Category.js';
import Subscription from '../models/Subscription.js';
import BusinessLocation from '../models/BusinessLocation.js';
import PageVisit from '../models/PageVisit.js';
import DailySummary from '../models/DailySummary.js';
import Offer from '../models/Offer.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { triggerOnboardingWebhook } from '../utils/n8n.js';
import { isValidCity } from '../utils/locationValidator.js';

// Get all businesses
export const getBusinesses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { category, city, search, featured, maxPrice, premiumOnly, sort, page = 1, limit = 10 } = req.query;

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
    const searchStr = (search as string).trim();
    const escaped = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = { $regex: escaped, $options: 'i' };
    const searchConditions: any[] = [
      { name: searchRegex },
      { description: searchRegex },
      { city: searchRegex },
      { address: searchRegex },
      { slug: searchRegex },
      { tags: searchRegex },
    ];

    const matchingCategories = await Category.find({
      $or: [{ name: searchRegex }, { slug: searchRegex }]
    }).select('_id');
    if (matchingCategories.length > 0) {
      searchConditions.push({ category: { $in: matchingCategories.map(c => c._id) } });
    }

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

  let businessesQuery = Business.find(filter)
    .populate('category', 'name slug icon')
    .populate('owner', 'name email')
    .skip(skip)
    .limit(limitNum);

  if (sort === '-rating') {
    businessesQuery = businessesQuery.sort({ rating: -1, reviewCount: -1, featured: -1 });
  } else {
    businessesQuery = businessesQuery.sort({ featured: -1, createdAt: -1 });
  }

  const businesses = await businessesQuery;

  const total = await Business.countDocuments(filter);

  const populatedBusinesses = await Promise.all(businesses.map(async (biz) => {
    try {
      const sub = await Subscription.findOne({ business: biz._id, status: 'active' });
      const locations = await BusinessLocation.find({ business: biz._id }).sort({ isPrimary: -1, createdAt: 1 });
      const plan = sub ? sub.plan : 'starter';
      const bizObj = biz.toObject() as any;
      bizObj.plan = plan;
      bizObj.locations = locations || [];

      // Filter heavy base64 image data URLs (> 100KB) from list responses to keep payload light (< 50KB) and prevent proxy ECONNRESET
      if (Array.isArray(bizObj.images)) {
        bizObj.images = bizObj.images.map((img: string) => {
          if (typeof img === 'string' && img.startsWith('data:image') && img.length > 100000) {
            return '';
          }
          return img;
        }).filter(Boolean);
      }

      return bizObj;
    } catch (e) {
      const bizObj = biz.toObject() as any;
      bizObj.plan = 'starter';
      bizObj.locations = [];
      return bizObj;
    }
  }));

  res.status(200).json({
    success: true,
    data: populatedBusinesses,
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

  const sub = await Subscription.findOne({ business: business._id, status: 'active' });
  const locations = await BusinessLocation.find({ business: business._id }).sort({ isPrimary: -1, createdAt: 1 });
  const plan = sub ? sub.plan : 'starter';

  const bizObj = business.toObject() as any;
  bizObj.plan = plan;
  bizObj.locations = locations;

  res.status(200).json({
    success: true,
    data: bizObj,
  });
});

// Get business by slug
export const getBusinessBySlug = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const slugOrId = req.params.slug;
    let business = await Business.findOneAndUpdate(
      { slug: slugOrId },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('category')
      .populate('owner', 'name email phone')
      .populate('highlights.stories');

    if (!business && mongoose.Types.ObjectId.isValid(slugOrId)) {
      business = await Business.findByIdAndUpdate(
        slugOrId,
        { $inc: { views: 1 } },
        { new: true }
      )
        .populate('category')
        .populate('owner', 'name email phone')
        .populate('highlights.stories');
    }

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    // Log the visit asynchronously
    PageVisit.create({ business: business._id }).catch(err => {
      console.error("Failed to log page visit:", err);
    });

    const sub = await Subscription.findOne({ business: business._id, status: 'active' });
    const locations = await BusinessLocation.find({ business: business._id }).sort({ isPrimary: -1, createdAt: 1 });
    const offers = await Offer.find({ business: business._id }).sort({ createdAt: -1 });
    const plan = sub ? sub.plan : 'starter';

    const bizObj = business.toObject() as any;
    bizObj.plan = plan;
    bizObj.locations = locations;
    bizObj.offers = offers;

    res.status(200).json({
      success: true,
      data: bizObj,
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

    if (!isValidCity(city)) {
      res.status(400).json({
        success: false,
        message: `Invalid city/region selected: ${city}`,
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

    if (updateData.city && !isValidCity(updateData.city)) {
      res.status(400).json({
        success: false,
        message: `Invalid city/region selected: ${updateData.city}`,
      });
      return;
    }

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
            'building-material': 'construction',
            'building_material': 'construction',
            'buildingmaterial': 'construction',
            'health': 'healthcare',
            'auto': 'automotive',
            'law': 'legal',
            'hotel': 'horeca',
            'restaurant': 'horeca',
            'food': 'horeca',
            'delivery': 'logistics',
            'transport': 'logistics',
            'spa': 'beauty',
            'school': 'education',
            'university': 'education',
            'bank': 'finance',
            'insurance': 'finance',
          };
          if (staticSlugMap[cleanSlug]) {
            cleanSlug = staticSlugMap[cleanSlug];
          }
          foundCategory = await Category.findOne({ slug: cleanSlug });

          // Last resort: try a case-insensitive partial name match
          if (!foundCategory) {
            foundCategory = await Category.findOne({
              name: { $regex: new RegExp(cleanSlug.replace(/-/g, '.*'), 'i') }
            });
          }
        }

        if (foundCategory) {
          updateData.category = foundCategory._id;
        } else {
          // Don't block the update — just remove category from the update payload
          // so we preserve the existing category instead of failing the entire save
          console.warn(`Category '${updateData.category}' not found, keeping existing category`);
          delete updateData.category;
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

    const businessesWithRank = await Promise.all(businesses.map(async (biz) => {
      const bizObj = biz.toObject() as any;
      const currentViews = biz.views || 0;

      // Current Rank across all active businesses
      const higherViewsCount = await Business.countDocuments({
        active: true,
        views: { $gt: currentViews }
      });
      bizObj.rank = higherViewsCount + 1;

      // Rank 1 day ago to avoid 7-day backfill zeroing
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const PageVisit = mongoose.model('PageVisit');
      const myRecentVisits = await PageVisit.countDocuments({ business: biz._id, timestamp: { $gte: oneDayAgo } });
      const myViews1DayAgo = currentViews - myRecentVisits;

      const activeBusinesses = await Business.find({ active: true }, '_id views');
      let higherViews1DayAgoCount = 0;

      const recentVisitsCount = await PageVisit.aggregate([
        { $match: { timestamp: { $gte: oneDayAgo } } },
        { $group: { _id: '$business', count: { $sum: 1 } } }
      ]);
      const visitMap = new Map(recentVisitsCount.map(v => [v._id.toString(), v.count]));

      for (const b of activeBusinesses) {
        if (b._id.toString() === biz._id.toString()) continue;
        const bRecentVisits = visitMap.get(b._id.toString()) || 0;
        const bViews1DayAgo = (b.views || 0) - bRecentVisits;
        if (bViews1DayAgo > myViews1DayAgo) {
          higherViews1DayAgoCount++;
        }
      }

      const rank1DayAgo = higherViews1DayAgoCount + 1;

      if (bizObj.rank < rank1DayAgo) bizObj.rankTrend = 'up'; // Rank improved (e.g. 15 -> 8)
      else if (bizObj.rank > rank1DayAgo) bizObj.rankTrend = 'down'; // Rank worsened (e.g. 8 -> 15)
      else {
        // If rank is exactly the same, but we got recent visits, let's show a subtle up trend!
        if (myRecentVisits > 0) bizObj.rankTrend = 'up';
        else bizObj.rankTrend = 'flat';
      }

      return bizObj;
    }));

    res.status(200).json({
      success: true,
      data: businessesWithRank,
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

// ─── GET Business Analytics ──────────────────────────────────────────
export const getBusinessAnalytics = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { period } = req.query; // '1d', '7d', '1m', '3m', '6m', '1y', 'all'

    let startDate = new Date();
    if (period === '1d') startDate.setDate(startDate.getDate() - 1);
    else if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '14d') startDate.setDate(startDate.getDate() - 14);
    else if (period === '1m') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === '3m') startDate.setMonth(startDate.getMonth() - 3);
    else if (period === '6m') startDate.setMonth(startDate.getMonth() - 6);
    else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
    else if (period === 'all') startDate = new Date(0); // Epoch

    const matchStage: any = { business: new mongoose.Types.ObjectId(id) };
    if (period !== 'all') {
      matchStage.timestamp = { $gte: startDate };
    }

    // Determine grouping based on period
    let format = "%Y-%m-%d"; // default daily
    if (period === '1d') format = "%Y-%m-%d %H:00"; // hourly
    else if (period === '1y' || period === 'all') format = "%Y-%m"; // monthly

    const visits = await PageVisit.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format, date: "$timestamp" } },
          views: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const data = visits.map(v => ({
      date: v._id,
      views: v.views
    }));

    res.status(200).json({
      success: true,
      data
    });
  }
);

// ─── Calendar / Daily Summaries ──────────────────────────────────────
export const getCalendarSummaries = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { month } = req.query; // YYYY-MM
    
    const filter: any = { business: new mongoose.Types.ObjectId(id) };
    if (month && typeof month === 'string') {
      filter.date = { $regex: `^${month}` }; // Matches "YYYY-MM-DD"
    }

    const summaries = await DailySummary.find(filter).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      data: summaries
    });
  }
);

export const updateDailySummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id, date } = req.params;
    const { summary, isClosed, stats } = req.body;

    const summaryDoc = await DailySummary.findOneAndUpdate(
      { business: new mongoose.Types.ObjectId(id), date },
      { summary, isClosed, stats },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: summaryDoc
    });
  }
);

// Check if a business is closed on a specific date (Public)
export const checkBusinessDateStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    if (!date || typeof date !== 'string') {
      res.status(400).json({ success: false, message: 'Please provide a valid date' });
      return;
    }

    const summaryDoc = await DailySummary.findOne({
      business: new mongoose.Types.ObjectId(id),
      date
    });

    res.status(200).json({
      success: true,
      isClosed: summaryDoc ? summaryDoc.isClosed : false,
      summary: summaryDoc ? summaryDoc.summary : ''
    });
  }
);
