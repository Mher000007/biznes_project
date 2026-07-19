import express from 'express';
import {
  createOffer,
  getOffersForBusiness,
  deleteOffer
} from '../controllers/offerController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .post(authenticate, createOffer);

router.route('/business/:businessId')
  .get(getOffersForBusiness);

router.route('/:id')
  .delete(authenticate, deleteOffer);

export default router;
