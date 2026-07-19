import { Request, Response } from 'express';
import Offer from '../models/Offer';
import Business from '../models/Business';

export const createOffer = async (req: Request, res: Response) => {
  try {
    const { businessId, packageName, dishes, pax, price, inclusions, location } = req.body;

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
      pax,
      price,
      inclusions,
      location,
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getOffersForBusiness = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
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
