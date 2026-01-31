import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';
import User from './Model/Usermodel.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function setupForDemo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Update bus times to be in the future
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0); // Start from 6 AM tomorrow

    const buses = await Bus.find().sort({ departure: 1 });
    console.log(`📍 Found ${buses.length} buses`);

    if (buses.length === 0) {
      console.log('⚠️ No buses found. Creating sample buses...');
      await createSampleBuses();
    } else {
      // Update existing buses with future times
      for (let i = 0; i < Math.min(buses.length, 50); i++) {
        const bus = buses[i];
        const newDeparture = new Date(tomorrow.getTime() + (i * 30 * 60 * 1000)); // 30 min apart
        const duration = 4 * 60 * 60 * 1000; // 4 hours journey
        const newArrival = new Date(newDeparture.getTime() + duration);

        await Bus.updateOne(
          { _id: bus._id },
          { 
            departure: newDeparture,
            arrival: newArrival,
            status: 'On Time',
            availableSeats: bus.totalSeats || 40,
            bookedSeats: []
          }
        );
      }
      console.log('✅ Updated bus schedules');
    }

    // 2. Ensure demo accounts exist
    await ensureDemoAccounts();

    console.log('🎉 Demo setup complete!');
    console.log('📱 You can now:');
    console.log('   - Login as admin@bookmyseat.com / admin123');
    console.log('   - Login as user@demo.com / user123');
    console.log('   - Search for buses from any city');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function createSampleBuses() {
  const routes = [
    { from: 'Mumbai', to: 'Pune', fare: 500 },
    { from: 'Delhi', to: 'Agra', fare: 400 },
    { from: 'Bangalore', to: 'Chennai', fare: 600 },
    { from: 'Hyderabad', to: 'Vijayawada', fare: 350 }
  ];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0);

  for (let i = 0; i < 20; i++) {
    const route = routes[i % routes.length];
    const departure = new Date(tomorrow.getTime() + (i * 30 * 60 * 1000));
    const arrival = new Date(departure.getTime() + 4 * 60 * 60 * 1000);

    await Bus.create({
      id: `BUS-${Date.now()}-${i}`,
      name: `Express ${i + 1}`,
      from: route.from,
      to: route.to,
      departure,
      arrival,
      fare: route.fare,
      totalSeats: 40,
      availableSeats: 40,
      bookedSeats: [],
      type: 'AC',
      operator: 'BookMySeat Express',
      busNumber: `MH${12 + i}AB${1000 + i}`,
      status: 'On Time'
    });
  }
  console.log('✅ Created 20 sample buses');
}

async function ensureDemoAccounts() {
  const accounts = [
    { email: 'admin@bookmyseat.com', password: 'admin123', name: 'Admin User', isAdmin: true },
    { email: 'user@demo.com', password: 'user123', name: 'Demo User', isAdmin: false }
  ];

  for (const account of accounts) {
    const existing = await User.findOne({ email: account.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      await User.create({
        name: account.name,
        email: account.email,
        password: hashedPassword,
        isAdmin: account.isAdmin
      });
      console.log(`✅ Created account: ${account.email}`);
    }
  }
}

setupForDemo();