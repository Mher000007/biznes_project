import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/biznes_project')
  .then(async () => {
    const Business = mongoose.model('Business', new mongoose.Schema({}, { strict: false }));
    const PageVisit = mongoose.model('PageVisit', new mongoose.Schema({}, { strict: false }));
    const biz = await Business.findOne({});
    console.log("Business Views:", biz.views);
    const visits = await PageVisit.find({});
    console.log("PageVisits count:", visits.length);
    console.log("PageVisits:", visits);
    process.exit(0);
  });
