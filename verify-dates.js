import mongoose from 'mongoose';
import Bus from './Model/Busmodel.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifyDates() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus_tbooking');
    console.log('🔍 CHECKING BUS DATES...');
    
    const buses = await Bus.find().sort({ departure: 1 }).limit(10);
    
    console.log(`\nFound ${buses.length} buses. First 10:`);
    buses.forEach((bus, i) => {
      const depDate = new Date(bus.departure);
      console.log(`${i+1}. ${bus.name}: ${depDate.toDateString()} ${depDate.toTimeString().slice(0,5)}`);
    });
    
    const today = new Date('2026-01-31');
    const todayBuses = await Bus.find({
      departure: {
        $gte: new Date(today.setHours(0,0,0,0)),
        $lt: new Date(today.setHours(23,59,59,999))
      }
    }).countDocuments();
    
    console.log(`\n📅 Buses available for Jan 31, 2026: ${todayBuses}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyDates();