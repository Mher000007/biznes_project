import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getConversations, getMessages, sendMessage } from '../controllers/chatController.js';

const router = express.Router();

// Admin: Get all conversations
router.get('/conversations', authenticate, authorize('admin'), getConversations);

// User & Admin: Get messages for a specific conversation
// For a normal user, the conversationId is ignored and their own ID is used.
router.get('/:conversationId', authenticate, getMessages);

// User & Admin: Send a message
// Admin must provide conversationId in body, User's conversationId is inferred from their ID.
router.post('/', authenticate, sendMessage);

export default router;
