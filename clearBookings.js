import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './Model/Bookingmodel.js';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function clearAllBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear all bookings
    const deletedBookings = await Booking.deleteMany({});
    console.log(`Deleted ${deletedBookings.deletedCount} bookings`);
    
    // Reset all bus seats
    const buses = await Bus.find({});
    for (const bus of buses) {
      bus.bookedSeats = [];
      bus.availableSeats = bus.totalSeats;
      await bus.save();
    }
    console.log(`Reset seats for ${buses.length} buses`);
    
    console.log('✅ All booking history cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing bookings:', error);
    process.exit(1);
  }
}

clearAllBookings();