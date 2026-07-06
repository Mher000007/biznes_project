import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(uri);
  const Business = mongoose.model('Business', new mongoose.Schema({ views: Number, name: String, active: Boolean, category: mongoose.Schema.Types.ObjectId, city: String }, { strict: false }));
  
  const hungryBiz = await Business.findOne({ name: 'Hungry' });

  const higher = await Business.countDocuments({ 
    active: true, 
    category: hungryBiz.category,
    city: hungryBiz.city,
    views: { $gt: hungryBiz.views } 
  });

  console.log(`Hungry rank in its category and city (${hungryBiz.city}) is: ${higher + 1}`);

  process.exit(0);
}
check();
