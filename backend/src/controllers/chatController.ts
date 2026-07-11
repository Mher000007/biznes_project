import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Send a new chat message
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message text is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const isAdmin = req.user.role === 'admin';
    const targetConversationId = isAdmin ? conversationId : req.user.id;

    if (!targetConversationId) {
      res.status(400).json({ success: false, message: 'Conversation ID is required' });
      return;
    }

    const newMessage = new ChatMessage({
      conversationId: targetConversationId,
      sender: req.user.id,
      senderName: isAdmin ? 'Admin' : req.user.name,
      message,
      read: false,
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

/**
 * Get messages for a specific conversation
 */
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const isAdmin = req.user.role === 'admin';
    const conversationId = isAdmin ? req.params.conversationId : req.user.id;

    if (!conversationId) {
      res.status(400).json({ success: false, message: 'Conversation ID is required' });
      return;
    }

    const messages = await ChatMessage.find({ conversationId }).sort({ createdAt: 1 });

    // Mark as read when fetched
    const filter = {
      conversationId,
      read: false,
      sender: { $ne: req.user.id }
    };
    
    // We update the read status asynchronously
    ChatMessage.updateMany(filter, { $set: { read: true } }).exec().catch(err => console.error(err));

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

/**
 * Admin: Get all conversations
 */
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    // Find the latest message for each conversation
    const latestMessages = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          latestMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$read', false] }, { $ne: ['$sender', new mongoose.Types.ObjectId(req.user.id)] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate user info for conversationId if it's a valid ObjectId
    const result = await Promise.all(latestMessages.map(async (conv) => {
      let userName = 'Unknown Business';
      if (mongoose.Types.ObjectId.isValid(conv._id)) {
        const user = await User.findById(conv._id).select('name email');
        if (user) {
          userName = user.name;
        }
      }
      return {
        conversationId: conv._id,
        userName,
        latestMessage: conv.latestMessage,
        unreadCount: conv.unreadCount
      };
    }));

    // Sort by latest message date descending
    result.sort((a, b) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime());

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};
