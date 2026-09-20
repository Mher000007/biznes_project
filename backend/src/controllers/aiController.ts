import { Request, Response } from 'express';
import OpenAI from 'openai';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "";
const openai = new OpenAI({
  apiKey: apiKey || "dummy-key",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateCaption = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { businessName, businessType, topic } = req.body;

    if (!topic) {
      res.status(400).json({ success: false, message: 'Please provide a topic' });
      return;
    }

    if (!apiKey) {
      // Mock generation to prevent 500 error if API key is not set
      res.status(200).json({
        success: true,
        caption: `Exciting update about ${topic} at ${businessName || 'our store'}! ✨`,
      });
      return;
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gemini-1.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert social media manager. Generate a short, creative, and engaging caption for a story. It must be very brief (under 120 characters) and include 1-2 relevant emojis.`
          },
          {
            role: "user",
            content: `Business Name: ${businessName || "Unknown"}\nBusiness Type: ${businessType || "Unknown"}\nTopic: ${topic}`
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
      });

      const caption = completion.choices[0]?.message?.content?.trim() || "";

      res.status(200).json({
        success: true,
        caption,
      });
    } catch (error) {
      console.error("AI Caption Generation Error:", error);
      res.status(500).json({ success: false, message: 'Failed to generate caption' });
    }
  }
);
