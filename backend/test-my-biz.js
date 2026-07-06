import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(async () => {
    const Business = mongoose.model('Business', new mongoose.Schema({ views: Number, active: Boolean, owner: mongoose.Schema.Types.ObjectId }, { strict: false }));
    const b = await Business.findOne({ views: 6 });
    if (!b) return console.log("No business with 6 views");
    console.log("Found biz with 6 views. Owner:", b.owner);

    const businesses = await Business.find({ owner: b.owner });
    const businessesWithRank = await Promise.all(businesses.map(async (biz) => {
      const bizObj = biz.toObject() as any;
      const higherViewsCount = await Business.countDocuments({ active: true, views: { $gt: biz.views || 0 } });
      bizObj.rank = higherViewsCount + 1;
      return bizObj;
    }));
    console.log("With rank:", businessesWithRank.map(bz => bz.rank));
    process.exit(0);
  });
