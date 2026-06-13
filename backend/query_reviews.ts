import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Business from './src/models/Business.js';
import Review from './src/models/Review.js';

dotenv.config();

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/for-business';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected. Using model:', Business.modelName);
  console.log('Querying reviews...');
  const reviews = await Review.find().populate('business');
  console.log('REVIEWS_JSON_START');
  console.log(JSON.stringify(reviews, null, 2));
  console.log('REVIEWS_JSON_END');
  await mongoose.disconnect();
}

main().catch(console.error);
