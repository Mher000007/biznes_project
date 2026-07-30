import express from 'express';
import {
  getExchangeOffers,
  getBusinessExchangeOffers,
  createExchangeOffer,
  updateExchangeOffer,
  deleteExchangeOffer,
  toggleSaveExchangeOffer,
  claimExchangeOffer,
} from '../controllers/exchangeOfferController.js';

import { authenticate, requireVerified } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(getExchangeOffers)
  .post(authenticate as any, requireVerified as any, createExchangeOffer as any);

router
  .route('/business/:businessId')
  .get(getBusinessExchangeOffers);

router
  .route('/:id/toggle-save')
  .post(authenticate as any, requireVerified as any, toggleSaveExchangeOffer as any);

router
  .route('/:id/claim')
  .post(authenticate as any, requireVerified as any, claimExchangeOffer as any);

router
  .route('/:id')
  .put(authenticate as any, requireVerified as any, updateExchangeOffer as any)
  .delete(authenticate as any, requireVerified as any, deleteExchangeOffer as any);

export default router;
