import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(uri);
  const Business = mongoose.model('Business', new mongoose.Schema({ views: Number, name: String, active: Boolean, category: mongoose.Schema.Types.ObjectId }, { strict: false }));
  
  const hungryBiz = await Business.findOne({ name: 'Hungry' });
  if (!hungryBiz) return process.exit(1);

  const higherInSameCategory = await Business.countDocuments({ 
    active: true, 
    category: hungryBiz.category,
    views: { $gt: hungryBiz.views } 
  });

  console.log(`Hungry rank in its category is: ${higherInSameCategory + 1}`);

  process.exit(0);
}
check();
