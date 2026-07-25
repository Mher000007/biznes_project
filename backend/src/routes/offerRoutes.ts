import express from 'express';
import {
  createOffer,
  getOffersForBusiness,
  deleteOffer,
  updateOffer,
  searchOffersForAi
} from '../controllers/offerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.route('/ai-search')
  .get(searchOffersForAi);

router.route('/')
  .post(authenticate, createOffer);

router.route('/business/:businessId')
  .get(getOffersForBusiness);

router.route('/:id')
  .put(authenticate, updateOffer)
  .delete(authenticate, deleteOffer);

export default router;
