import express from 'express';
import {
  createOffer,
  getOffersForBusiness,
  deleteOffer,
  updateOffer,
  searchOffersForAi
} from '../controllers/offerController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';

const router = express.Router();

router.route('/ai-search')
  .get(searchOffersForAi);

router.route('/')
  .post(authenticate, requireVerified, createOffer);

router.route('/business/:businessId')
  .get(getOffersForBusiness);

router.route('/:id')
  .put(authenticate, requireVerified, updateOffer)
  .delete(authenticate, requireVerified, deleteOffer);

export default router;
