import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function fixBusTimings() {
  try {
    await connectDb();
    console.log('🔧 Fixing bus timings...');
    
    const buses = await Bus.find({});
    console.log(`Found ${buses.length} buses to update`);
    
    const today = new Date('2026-01-30');
    const timeVariations = {
      'RedBus Travels': { hourOffset: 0, minuteOffset: 0 },
      'Orange Travels': { hourOffset: 1, minuteOffset: 0 },
      'SRS Travels': { hourOffset: 0, minuteOffset: 30 },
      'VRL Travels': { hourOffset: 1, minuteOffset: 30 }
    };
    
    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];
      const dayOffset = Math.floor(i / 32); // 32 buses per day
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      
      // Get time variation for operator
      const variation = timeVariations[bus.operator] || { hourOffset: 0, minuteOffset: 0 };
      
      // Base time slots
      const baseHours = [6, 9, 12, 15, 18, 21]; // 6AM, 9AM, 12PM, 3PM, 6PM, 9PM
      const slotIndex = i % baseHours.length;
      
      // Create departure time with variation
      const departureTime = new Date(currentDate);
      departureTime.setHours(
        baseHours[slotIndex] + variation.hourOffset,
        variation.minuteOffset + (i % 4) * 15, // 0, 15, 30, 45 minute variations
        0, 0
      );
      
      // Calculate arrival (3-6 hours later based on route)
      const duration = 3 + Math.random() * 3; // 3-6 hours
      const arrivalTime = new Date(departureTime.getTime() + duration * 60 * 60 * 1000);
      
      // Update bus
      await Bus.findByIdAndUpdate(bus._id, {
        departure: departureTime,
        arrival: arrivalTime,
        status: dayOffset === 0 ? 'Active' : 'Active'
      });
    }
    
    console.log('✅ Updated all bus timings successfully!');
    
    // Show sample
    const sampleBuses = await Bus.find({}).limit(5);
    console.log('\n📋 Sample Updated Buses:');
    sampleBuses.forEach(bus => {
      console.log(`${bus.operator} - ${bus.from} to ${bus.to}`);
      console.log(`Departure: ${bus.departure.toLocaleString()}`);
      console.log(`Arrival: ${bus.arrival.toLocaleString()}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixBusTimings();