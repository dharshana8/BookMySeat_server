import mongoose from 'mongoose';
import Bus from './Model/Busmodel.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixDatesToToday() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus_tbooking');
    console.log('🔄 Setting all bus dates to current January 2026...');
    
    const buses = await Bus.find();
    console.log(`Found ${buses.length} buses to update`);
    
    // Use actual current date (January 31, 2026)
    const today = new Date();
    console.log(`Using current date: ${today.toDateString()}`);
    
    let updated = 0;
    
    for (const bus of buses) {
      const originalTime = new Date(bus.departure);
      const hours = originalTime.getHours();
      const minutes = originalTime.getMinutes();
      
      // Set date to current date + spread across days
      const daysToAdd = Math.floor(updated / 72);
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + daysToAdd);
      newDate.setHours(hours, minutes, 0, 0);
      
      // Calculate arrival
      const duration = new Date(bus.arrival) - new Date(bus.departure);
      const newArrival = new Date(newDate.getTime() + duration);
      
      bus.departure = newDate;
      bus.arrival = newArrival;
      
      if (!bus.id) {
        bus.id = `BUS-${newDate.getTime()}-${Math.random().toString(36).substr(2, 5)}`;
      }
      
      await bus.save();
      updated++;
    }
    
    console.log(`✅ Updated ${updated} buses to current 2026 dates`);
    
    const sample = await Bus.find().sort({ departure: 1 }).limit(3);
    console.log('\nFirst 3 buses now show:');
    sample.forEach(bus => {
      console.log(`${bus.name}: ${bus.departure.toDateString()} ${bus.departure.toTimeString().slice(0,5)}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDatesToToday();