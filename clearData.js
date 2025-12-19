import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import User from './Model/Usermodel.js';
import Bus from './Model/Busmodel.js';
import Booking from './Model/Bookingmodel.js';

dotenv.config();

async function clearAllData() {
  try {
    await connectDb();
    
    console.log('Clearing all data...');
    
    // Clear all collections
    await User.deleteMany({});
    await Bus.deleteMany({});
    await Booking.deleteMany({});
    
    console.log('✅ All users cleared');
    console.log('✅ All buses cleared');
    console.log('✅ All bookings cleared');
    console.log('🎉 Database cleared successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing data:', err);
    process.exit(1);
  }
}

clearAllData();