import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/for-business';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✓ Primary MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('⚠️ Primary MongoDB connection timed out:', (error as Error).message || error);
    try {
      console.log('🔄 Attempting local MongoDB fallback...');
      await mongoose.connect('mongodb://127.0.0.1:27017/for-business', { serverSelectionTimeoutMS: 3000 });
      console.log('✓ Local MongoDB connected successfully');
      return true;
    } catch (fallbackErr) {
      console.warn('⚠️ Fallback MongoDB unavailable. Server running, MongoDB will retry in background...');
      return false;
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error);
    process.exit(1);
  }
};
