import express from 'express';
import { authenticate, authorize, requireVerified } from '../middleware/auth.js';
import { getConversations, getMessages, sendMessage } from '../controllers/chatController.js';

const router = express.Router();

// Admin: Get all conversations
router.get('/conversations', authenticate, authorize('admin'), getConversations);

// User & Admin: Get messages for a specific conversation
router.get('/:conversationId', authenticate, requireVerified, getMessages);

// User & Admin: Send a message
router.post('/', authenticate, requireVerified, sendMessage);

export default router;
