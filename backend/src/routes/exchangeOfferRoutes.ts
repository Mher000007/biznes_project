import express from 'express';
import {
  getExchangeOffers,
  getBusinessExchangeOffers,
  createExchangeOffer,
  updateExchangeOffer,
  deleteExchangeOffer,
  toggleSaveExchangeOffer,
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
  .route('/:id/toggle-save')
  .post(authenticate as any, toggleSaveExchangeOffer as any);

router
  .route('/:id')
  .put(authenticate as any, updateExchangeOffer as any)
  .delete(authenticate as any, deleteExchangeOffer as any);

export default router;
