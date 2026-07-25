import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/for-business';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✓ Primary MongoDB connected successfully');
  } catch (error) {
    console.error('⚠️ Primary MongoDB connection timed out:', error);
    try {
      console.log('🔄 Attempting local MongoDB fallback...');
      await mongoose.connect('mongodb://127.0.0.1:27017/for-business', { serverSelectionTimeoutMS: 4000 });
      console.log('✓ Local MongoDB connected successfully');
    } catch (fallbackErr) {
      console.warn('⚠️ Fallback MongoDB unavailable. Server running, MongoDB will retry in background...');
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
