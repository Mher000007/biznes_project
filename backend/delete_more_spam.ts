import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Business from './src/models/Business.js';
import Review from './src/models/Review.js';

dotenv.config();

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/for-business';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  const spamAuthors = [
    'գեռգֆդսադֆգհգգգ',
    'hbjk',
    'fqefewfvwef',
    'vwrefvrewg',
    'wrvwrvvw',
    'feqfewfewf'
  ];

  console.log('Searching for spam reviews to delete...');
  const result = await Review.deleteMany({ authorName: { $in: spamAuthors } });
  console.log(`Deleted ${result.deletedCount} spam reviews.`);

  console.log('Recalculating business ratings and review counts...');
  const businesses = await Business.find();

  for (const biz of businesses) {
    const agg = await Review.aggregate([
      { $match: { business: biz._id, status: { $ne: 'resolved_deleted' } } },
      {
        $group: {
          _id: '$business',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (agg.length > 0) {
      const newRating = Math.round(agg[0].avgRating * 10) / 10;
      const newCount = agg[0].count;
      await Business.findByIdAndUpdate(biz._id, {
        rating: newRating,
        reviewCount: newCount,
      });
    } else {
      await Business.findByIdAndUpdate(biz._id, {
        rating: 0,
        reviewCount: 0,
      });
    }
  }

  console.log('Recalculation finished.');
  await mongoose.disconnect();
}

main().catch(console.error);
