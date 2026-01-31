import mongoose from 'mongoose';
import Bus from './Model/Busmodel.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixDates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    
    const buses = await Bus.find().sort({ departure: 1 });
    console.log(`Fixing ${buses.length} buses...`);
    
    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];
      const newDeparture = new Date(tomorrow.getTime() + (i * 15 * 60 * 1000));
      const duration = new Date(bus.arrival) - new Date(bus.departure);
      const newArrival = new Date(newDeparture.getTime() + duration);
      
      await Bus.updateOne({ _id: bus._id }, {
        departure: newDeparture,
        arrival: newArrival,
        availableSeats: bus.totalSeats || 40,
        status: 'On Time'
      });
    }
    
    console.log('✅ Fixed all bus dates');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDates();