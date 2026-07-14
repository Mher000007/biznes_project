const mongoose = require('mongoose');
const Booking = require('./backend/src/models/Booking').default || require('./backend/src/models/Booking');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/armbiz');
  const db = mongoose.connection.useDb('test'); // wait, what is the DB name? Let's check backend/.env
  // actually I can just use mongo shell or look at backend/.env
}
test();
