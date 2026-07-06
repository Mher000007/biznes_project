import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function boost() {
  await mongoose.connect(uri);
  const Business = mongoose.model('Business', new mongoose.Schema({ views: Number, name: String, active: Boolean }, { strict: false }));
  
  // Find top 5 views
  const topBusinesses = await Business.find({ active: true }).sort({ views: -1 }).limit(5);
  console.log("Top 5 views:", topBusinesses.map(b => b.views));
  
  const hungryBiz = await Business.findOne({ name: 'Hungry' });
  if (hungryBiz) {
    const targetViews = topBusinesses[4].views + 1; // Beat the 5th place
    console.log(`Boosting ${hungryBiz.name} from ${hungryBiz.views} to ${targetViews}`);
    hungryBiz.views = targetViews;
    await hungryBiz.save();
    console.log("Success!");
  } else {
    console.log("Could not find Hungry.");
  }
  
  process.exit(0);
}
boost();
