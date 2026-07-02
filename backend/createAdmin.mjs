/**
 * createAdmin.mjs
 * Run once to create the admin user in MongoDB.
 * Usage: node createAdmin.mjs
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/armbiz';

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  username:    { type: String, unique: true, sparse: true, lowercase: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true, select: false },
  phone:       String,
  avatar:      String,
  accountType: { type: String, enum: ['personal', 'business'], default: 'personal' },
  verified:    { type: Boolean, default: false },
  role:        { type: String, enum: ['user', 'business_owner', 'admin'], default: 'user' },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB:', MONGO_URI);

  const email = 'admin@armbiz.am';
  const existing = await User.findOne({ email }).lean();

  if (existing) {
    console.log('⚠️  Admin already exists:', email);
    // Update role to admin just in case
    await User.updateOne({ email }, { $set: { role: 'admin' } });
    console.log('✓ Ensured role=admin for', email);
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash('admin123', salt);

  await User.create({
    name: 'Admin',
    username: 'admin_armbiz',
    email,
    password: hashed,
    role: 'admin',
    accountType: 'personal',
    verified: true,
  });

  console.log('✅ Admin user created successfully!');
  console.log('   Email:    admin@armbiz.am');
  console.log('   Password: admin123');
  console.log('\n⚠️  Change the password after first login!');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
