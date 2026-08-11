const mongoose = require('mongoose');

async function get() {
  await mongoose.connect('mongodb://localhost:27017/biznes_project');
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({});
  console.log(user._id.toString(), user.verified);
  process.exit(0);
}
get();
