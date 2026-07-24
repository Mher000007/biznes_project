import express from 'express';
import {
  getExchangeOffers,
  getBusinessExchangeOffers,
  createExchangeOffer,
  updateExchangeOffer,
  deleteExchangeOffer,
} from '../controllers/exchangeOfferController.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(getExchangeOffers)
  .post(authenticate as any, createExchangeOffer as any);

router
  .route('/business/:businessId')
  .get(getBusinessExchangeOffers);

router
  .route('/:id')
  .put(authenticate as any, updateExchangeOffer as any)
  .delete(authenticate as any, deleteExchangeOffer as any);

export default router;
