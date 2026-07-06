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
  
  const myBiz = await Business.findOne({ active: true }).sort({ views: -1 }).skip(5).limit(1);
  if (myBiz) {
    const targetViews = topBusinesses[4].views + 1; // Beat the 5th place
    console.log(`Boosting ${myBiz.name} from ${myBiz.views} to ${targetViews}`);
    myBiz.views = targetViews;
    await myBiz.save();
    console.log("Success!");
  } else {
    console.log("Could not find the 6th business.");
  }
  
  process.exit(0);
}
boost();
