import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  name: string;
  slug: string;
  description: string;
  category: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  email: string;
  phone: string;
  website?: string;
  logo?: string;
  images?: string[];
  address: string;
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  reviewCount: number;
  views: number;
  tags?: string[];
  verified: boolean;
  featured: boolean;
  active: boolean;
  plan?: string;
  services?: Array<{
    name: string;
    description?: string;
    price: number;
    duration?: string;
  }>;
  menu?: Array<{
    name: string;
    description?: string;
    price: number;
    category?: string;
  }>;
  highlights?: Array<{
    imageUrl: string;
    title: string;
    description?: string;
  }>;
  layoutConfig?: {
    themeColor?: string;
    displayLogo?: boolean;
    displayGallery?: boolean;
    layoutType?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>({
  name: {
    type: String,
    required: [true, 'Please provide a business name'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
  },
  website: String,
  logo: String,
  images: [String],
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  country: {
    type: String,
    required: true,
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  tags: [String],
  verified: {
    type: Boolean,
    default: false,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  services: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    duration: String,
  }],
  menu: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
  }],
  highlights: [{
    imageUrl: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }],
  }],
  layoutConfig: {
    themeColor: { type: String, default: '#0f172a' },
    displayLogo: { type: Boolean, default: true },
    displayGallery: { type: Boolean, default: true },
    layoutType: { type: String, default: 'standard' },
  },
  metadata: Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create slug from name
businessSchema.pre('save', async function (next) {
  if (!this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
      
    let uniqueSlug = baseSlug;
    let counter = 1;
    
    const BusinessModel = this.constructor as mongoose.Model<any>;
    
    while (true) {
      const existing = await BusinessModel.findOne({ slug: uniqueSlug });
      if (!existing || existing._id.equals(this._id)) {
        break;
      }
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = uniqueSlug;
  }
  next();
});

// Indexes for better query performance
businessSchema.index({ city: 1, country: 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ owner: 1 });
businessSchema.index({ featured: 1, verified: 1 });

export default mongoose.model<IBusiness>('Business', businessSchema);
