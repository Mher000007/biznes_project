import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/for-business');
  const count = await Booking.countDocuments();
  console.log("Total bookings:", count);
  process.exit(0);
}
run();
