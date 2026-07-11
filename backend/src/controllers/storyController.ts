import { Response } from 'express';
import Story from '../models/Story.js';
import Business from '../models/Business.js';
import Subscription from '../models/Subscription.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// ─── CREATE story ─────────────────────────────────────────────────────────────
export const createStory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { mediaUrl, mediaType, caption, duration } = req.body;

    if (!mediaUrl) {
      res.status(400).json({ success: false, message: 'Please provide mediaUrl' });
      return;
    }

    // Find the business owned by the current user
    const business = await Business.findOne({ owner: req.user?.id });

    if (!business) {
      res.status(404).json({ success: false, message: 'You must register a business first to publish stories' });
      return;
    }

    if (!business.verified) {
      res.status(403).json({ success: false, message: 'Your business is not verified yet. Story publishing is restricted to verified businesses.' });
      return;
    }

    if (!business.active) {
      res.status(403).json({ success: false, message: 'Your business is currently inactive' });
      return;
    }

    const sub = await Subscription.findOne({ business: business._id, status: 'active' });
    
    let validDuration = 24;
    if (sub && sub.plan === 'premium' && duration && !isNaN(Number(duration))) {
      validDuration = Number(duration);
    }

    const expiresAt = new Date(Date.now() + validDuration * 60 * 60 * 1000);

    const story = await Story.create({
      business: business._id,
      mediaUrl,
      mediaType: mediaType || 'image',
      caption,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      data: story,
    });
  }
);

// ─── GET all active stories grouped by business ──────────────────────────────
export const getActiveStories = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const now = new Date();

    // Fetch all stories that are active
    const activeStories = await Story.find({ expiresAt: { $gt: now } })
      .populate({
        path: 'business',
        select: 'name slug logo verified active'
      })
      .sort({ createdAt: 1 });

    // Filter out active stories for inactive or unverified businesses
    const filteredStories = activeStories.filter((s: any) => s.business && s.business.active && s.business.verified);

    // Group stories by business
    const groupedMap = new Map<string, any>();

    for (const story of filteredStories) {
      const biz = story.business as any;
      const bizIdStr = biz._id.toString();

      if (!groupedMap.has(bizIdStr)) {
        groupedMap.set(bizIdStr, {
          business: {
            _id: biz._id,
            name: biz.name,
            slug: biz.slug,
            logo: biz.logo,
            verified: biz.verified,
          },
          stories: [],
        });
      }

      groupedMap.get(bizIdStr).stories.push({
        _id: story._id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        views: story.views,
      });
    }

    res.status(200).json({
      success: true,
      data: Array.from(groupedMap.values()),
    });
  }
);

// ─── GET my business stories ──────────────────────────────────────────────────
export const getMyBusinessStories = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const business = await Business.findOne({ owner: req.user?.id });

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    const stories = await Story.find({ business: business._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: stories,
    });
  }
);

// ─── VIEW story ───────────────────────────────────────────────────────────────
export const viewStory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { viewerId } = req.body; // optional user identifier

    const story = await Story.findById(id);

    if (!story) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    // Identify viewer: use viewerId from frontend or client IP address
    const viewerKey = viewerId || req.ip || req.headers['x-forwarded-for'] || 'anonymous-viewer';

    // Check if the viewer key has already viewed this story
    if (!story.views.includes(viewerKey as string)) {
      story.views.push(viewerKey as string);
      await story.save();
    }

    res.status(200).json({
      success: true,
      viewsCount: story.views.length,
    });
  }
);

// ─── DELETE story ─────────────────────────────────────────────────────────────
export const deleteStory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const story = await Story.findById(id);

    if (!story) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    // Verify ownership of the business
    const business = await Business.findById(story.business);
    if (!business || (business.owner.toString() !== req.user?.id && req.user?.role !== 'admin')) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this story' });
      return;
    }

    await Story.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully',
    });
  }
);
