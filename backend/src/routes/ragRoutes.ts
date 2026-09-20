import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { searchVenuesRAG, generateEmbeddings, saveUserMemory, getUserMemories } from '../controllers/ragController.js';

const router = express.Router();

router.get('/search', searchVenuesRAG);

// Memory routes
router.post('/memory', saveUserMemory);
router.get('/memory', getUserMemories);

// Admin route to trigger generating missing embeddings
router.post('/generate-embeddings', authenticate, authorize('admin'), generateEmbeddings);

export default router;
