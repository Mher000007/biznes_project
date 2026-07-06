import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(async () => {
    const Business = mongoose.model('Business', new mongoose.Schema({ views: Number, active: Boolean }, { strict: false }));
    const count = await Business.countDocuments({ active: true, views: { $gt: 6 } });
    console.log("Count with views > 6:", count);
    const all = await Business.find({}, {views: 1}).sort({views: -1});
    console.log("All views:");
    all.forEach(b => console.log(b.views));
    process.exit(0);
  });
