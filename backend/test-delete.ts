import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();
async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/for-business');
  const booking = await Booking.findOne().populate('business');
  if (booking) {
    console.log("Found booking:", booking._id);
    const business = booking.business as any;
    console.log("Business owner:", business?.owner?.toString());
  } else {
    console.log("No bookings found");
  }
  process.exit();
}
test();
