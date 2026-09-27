const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/for-business', { serverSelectionTimeoutMS: 3000 });
  const Business = mongoose.model('Business', new mongoose.Schema({
    name: String, description: String, city: String, address: String, slug: String, tags: [String], category: mongoose.Types.ObjectId
  }, { strict: false }));
  
  const searchRegex = { $regex: 'test', $options: 'i' };
  const searchConditions = [
    { name: searchRegex },
    { description: searchRegex },
    { city: searchRegex },
    { address: searchRegex },
    { slug: searchRegex },
    { tags: searchRegex },
  ];
  
  const filter = { active: true, verified: true, $or: searchConditions };
  try {
    const res = await Business.find(filter).limit(1);
    console.log('Success!', res);
  } catch (err) {
    console.error('Query Error:', err);
  }
  await mongoose.disconnect();
}

test().catch(console.error);
