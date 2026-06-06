import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  business: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName: string;      // denormalised snapshot for fast reads
  rating: number;          // 1–5
  comment: string;         // max 1000 chars
  isVerified: boolean;     // set true if reviewer actually completed a booking
  helpfulCount: number;    // likes/helpful votes
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, 'Author name too long'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per business
reviewSchema.index({ business: 1, author: 1 }, { unique: true });

// After saving a review, recalculate business rating atomically
reviewSchema.post('save', async function () {
  const Business = mongoose.model('Business');
  const agg = await mongoose.model('Review').aggregate([
    { $match: { business: this.business } },
    {
      $group: {
        _id: '$business',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (agg.length > 0) {
    await Business.findByIdAndUpdate(this.business, {
      rating: Math.round(agg[0].avgRating * 10) / 10,
      reviewCount: agg[0].count,
    });
  }
});

// After removing a review, recalculate business rating
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  const Business = mongoose.model('Business');
  const agg = await mongoose.model('Review').aggregate([
    { $match: { business: doc.business } },
    {
      $group: {
        _id: '$business',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (agg.length > 0) {
    await Business.findByIdAndUpdate(doc.business, {
      rating: Math.round(agg[0].avgRating * 10) / 10,
      reviewCount: agg[0].count,
    });
  } else {
    await Business.findByIdAndUpdate(doc.business, {
      rating: 0,
      reviewCount: 0,
    });
  }
});

export default mongoose.model<IReview>('Review', reviewSchema);
