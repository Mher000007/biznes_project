import { Request, Response } from 'express';
import OpenAI from 'openai';
import Business from '../models/Business.js';
import Offer from '../models/Offer.js';
import UserMemory from '../models/UserMemory.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY",
});

export const searchVenuesRAG = async (req: Request, res: Response) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: q,
    });
    
    const queryVector = embeddingResponse.data[0].embedding;

    // Use MongoDB Atlas Vector Search
    const businesses = await Business.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", // Name of the Atlas Search Index
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 100,
          limit: parseInt(limit as string, 10),
        }
      } as any,
      {
        $project: {
          embedding: 0 // exclude embedding from results
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: businesses
    });
  } catch (error: any) {
    console.error("RAG Search Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateEmbeddings = async (req: Request, res: Response) => {
  try {
    // Generate for all businesses missing embeddings
    const businesses = await Business.find({ embedding: { $exists: false } }).limit(50);
    let count = 0;
    
    for (const biz of businesses) {
      const textToEmbed = `${biz.name}. ${biz.description}. Location: ${biz.city}, ${biz.address}. Tags: ${biz.tags?.join(', ')}`;
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textToEmbed,
      });
      biz.embedding = response.data[0].embedding;
      await biz.save();
      count++;
    }

    res.status(200).json({
      success: true,
      message: `Generated embeddings for ${count} businesses.`
    });
  } catch (error: any) {
    console.error("Generate Embeddings Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveUserMemory = async (req: Request, res: Response) => {
  try {
    const { userId, preference, category } = req.body;
    if (!userId || !preference) {
      return res.status(400).json({ success: false, message: 'Missing userId or preference' });
    }
    
    // Create new memory
    const memory = await UserMemory.create({ user: userId, preference, category });
    
    res.status(201).json({ success: true, data: memory });
  } catch (error: any) {
    console.error("Save Memory Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserMemories = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }
    
    const memories = await UserMemory.find({ user: userId }).select('preference category -_id');
    
    res.status(200).json({ success: true, data: memories });
  } catch (error: any) {
    console.error("Get Memories Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

