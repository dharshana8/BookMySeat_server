import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function fixBusesForDemo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all buses to have departure times starting from now + 30 minutes
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

    const buses = await Bus.find().sort({ departure: 1 });
    console.log(`Found ${buses.length} buses to update`);

    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];
      const newDeparture = new Date(startTime.getTime() + (i * 15 * 60 * 1000)); // 15 minutes apart
      const duration = new Date(bus.arrival) - new Date(bus.departure);
      const newArrival = new Date(newDeparture.getTime() + duration);

      await Bus.updateOne(
        { _id: bus._id },
        { 
          departure: newDeparture,
          arrival: newArrival,
          status: 'On Time'
        }
      );
    }

    console.log('✅ All buses updated with future departure times!');
    console.log(`First bus departs at: ${startTime.toLocaleString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixBusesForDemo();