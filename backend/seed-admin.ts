// Run with: npx tsx seed-admin.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/armbiz';
const ADMIN_EMAIL = 'admin@armbiz.am';
const ADMIN_PASSWORD = 'Admin@ArmBiz2025!';

async function seedAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  // Remove any existing admin
  await User.deleteOne({ email: ADMIN_EMAIL });
  console.log('Removed old admin if existed');

  // Create fresh via Mongoose (triggers pre-save hash hook)
  const admin = await User.create({
    name: 'ArmBiz Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    verified: true,
  });

  console.log('✅ Admin created via Mongoose');
  console.log('   ID:    ', admin._id.toString());
  console.log('   Email: ', admin.email);
  console.log('   Role:  ', admin.role);

  // Verify matchPassword works
  const found = await User.findById(admin._id).select('+password');
  if (found) {
    const ok = await found.matchPassword(ADMIN_PASSWORD);
    console.log('   matchPassword test:', ok ? '✅ PASS' : '❌ FAIL');
  }

  await mongoose.disconnect();
}

seedAdmin().catch(err => { console.error(err); process.exit(1); });
