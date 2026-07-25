import { Request, Response } from 'express';
import Offer from '../models/Offer';
import Business from '../models/Business';

export const createOffer = async (req: Request, res: Response) => {
  try {
    const { businessId, packageName, dishes, dishesEn, dishesRu, pax, price, inclusions, location, atmosphere } = req.body;

    // Ensure the business belongs to the currently authenticated user
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    // Assuming authMiddleware puts user on req.user
    // if (business.owner.toString() !== (req as any).user._id.toString()) {
    //  return res.status(403).json({ success: false, error: 'Not authorized to add offers to this business' });
    // }

    const offer = await Offer.create({
      business: businessId,
      packageName,
      dishes,
      dishesEn,
      dishesRu,
      pax,
      price,
      inclusions,
      location,
      atmosphere: atmosphere || 'family',
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

import mongoose from 'mongoose';

export const getOffersForBusiness = async (req: Request & { user?: any }, res: Response) => {
  try {
    let { businessId } = req.params;

    if (businessId === 'me') {
      const biz = await Business.findOne({ owner: req.user?.id });
      if (!biz) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      businessId = biz._id.toString();
    } else if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const offers = await Offer.find({ business: businessId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteOffer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    await offer.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateOffer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { packageName, dishes, dishesEn, dishesRu, pax, price, inclusions, location, atmosphere } = req.body;

    let offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    if (packageName !== undefined) offer.packageName = packageName;
    if (dishes !== undefined) offer.dishes = dishes;
    if (dishesEn !== undefined) offer.dishesEn = dishesEn;
    if (dishesRu !== undefined) offer.dishesRu = dishesRu;
    if (pax !== undefined) offer.pax = pax;
    if (price !== undefined) offer.price = price;
    if (inclusions !== undefined) offer.inclusions = inclusions;
    if (location !== undefined) offer.location = location;
    if (atmosphere !== undefined) offer.atmosphere = atmosphere;

    await offer.save();
    res.status(200).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Public AI Assistant Search Endpoint:
 * Allows AI Assistant / Search clients to query dining offers by pax, price, location, atmosphere, dish names, and keywords.
 */
export const searchOffersForAi = async (req: Request, res: Response) => {
  try {
    const { query, pax, minPrice, maxPrice, atmosphere, location, limit } = req.query;

    const filter: any = {};

    if (pax) {
      filter.pax = { $gte: Number(pax) };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (atmosphere) {
      filter.atmosphere = atmosphere;
    }

    if (location) {
      filter.location = { $regex: String(location), $options: 'i' };
    }

    if (query) {
      const qStr = String(query).trim();
      filter.$or = [
        { packageName: { $regex: qStr, $options: 'i' } },
        { dishes: { $regex: qStr, $options: 'i' } },
        { dishesEn: { $regex: qStr, $options: 'i' } },
        { dishesRu: { $regex: qStr, $options: 'i' } },
        { inclusions: { $regex: qStr, $options: 'i' } },
        { location: { $regex: qStr, $options: 'i' } },
      ];
    }

    const maxResults = Math.min(Number(limit) || 20, 50);

    const offers = await Offer.find(filter)
      .populate('business', 'name slug logo address phone rating reviewCount')
      .sort({ price: 1 })
      .limit(maxResults);

    // Format rich structured text context for AI model prompts
    const formattedForAi = offers.map(o => ({
      id: o._id,
      packageName: o.packageName,
      pax: o.pax,
      priceAmd: o.price,
      location: o.location,
      atmosphere: o.atmosphere,
      dishes: {
        hy: o.dishes,
        en: o.dishesEn || [],
        ru: o.dishesRu || []
      },
      inclusions: o.inclusions,
      business: o.business,
      aiPromptContext: `Package: "${o.packageName}" | Business: ${(o.business as any)?.name || 'N/A'} | Pax: ${o.pax} people | Price: ${o.price} AMD | Location: ${o.location} | Atmosphere: ${o.atmosphere} | Dishes: ${o.dishes.join(', ')} | Inclusions: ${o.inclusions.join(', ')}`
    }));

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
      aiStructured: formattedForAi
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
