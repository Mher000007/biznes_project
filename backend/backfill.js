import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to DB");
    const Business = mongoose.model('Business', new mongoose.Schema({ views: Number }, { strict: false }));
    const PageVisit = mongoose.model('PageVisit', new mongoose.Schema({
        business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
        timestamp: Date
    }, { strict: false }));
    
    const businesses = await Business.find({ views: { $gt: 0 } });
    console.log(`Found ${businesses.length} businesses with views > 0`);
    
    let added = 0;
    for (const biz of businesses) {
        const count = await PageVisit.countDocuments({ business: biz._id });
        if (count < biz.views) {
            const missing = biz.views - count;
            console.log(`Backfilling ${missing} views for business ${biz._id}`);
            
            // Distribute over the last 7 days
            for (let i = 0; i < missing; i++) {
                const randomDaysAgo = Math.floor(Math.random() * 7);
                const date = new Date();
                date.setDate(date.getDate() - randomDaysAgo);
                date.setHours(Math.floor(Math.random() * 24));
                
                await PageVisit.create({
                    business: biz._id,
                    timestamp: date
                });
                added++;
            }
        }
    }
    console.log(`Successfully backfilled ${added} views.`);
    process.exit(0);
  }).catch(err => {
      console.error(err);
      process.exit(1);
  });
