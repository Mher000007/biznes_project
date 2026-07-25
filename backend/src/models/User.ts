import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  contactEmail?: string;
  password: string;
  plainPassword?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  businessType?: string;
  accountType?: 'personal' | 'business';
  location?: string;
  verified: boolean;
  role: 'user' | 'business_owner' | 'admin';
  findyCoins?: number;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,          // allows multiple docs with null/undefined username
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9_]{3,30}$/, 'Username must be 3–30 characters (letters, numbers, underscore)'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  contactEmail: {
    type: String,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  plainPassword: {
    type: String,
    select: false,
  },
  phone: String,
  avatar: String,
  bio: String,
  businessType: String,
  accountType: {
    type: String,
    enum: ['personal', 'business'],
    default: 'personal',
  },
  location: String,
  verified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'business_owner', 'admin'],
    default: 'user',
  },
  findyCoins: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Auto-generate username from name if not provided
userSchema.pre('save', function (next) {
  if (!this.username && this.name) {
    const base = this.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    this.username = `${base}_${suffix}`.substring(0, 30);
  }
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
