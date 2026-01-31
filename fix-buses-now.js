import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function fixBusesNow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Clear existing buses
    await Bus.deleteMany({});
    console.log('Cleared existing buses');

    // Create simple buses for immediate testing
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const simpleBuses = [];
    const routes = [
      { from: 'Mumbai', to: 'Pune', fare: 500 },
      { from: 'Delhi', to: 'Agra', fare: 400 },
      { from: 'Bangalore', to: 'Chennai', fare: 600 },
      { from: 'Hyderabad', to: 'Vijayawada', fare: 350 },
      { from: 'Kolkata', to: 'Bhubaneswar', fare: 450 },
      { from: 'Ahmedabad', to: 'Surat', fare: 300 },
      { from: 'Jaipur', to: 'Udaipur', fare: 550 },
      { from: 'Kochi', to: 'Trivandrum', fare: 400 },
      { from: 'Chennai', to: 'Bangalore', fare: 600 },
      { from: 'Pune', to: 'Mumbai', fare: 500 },
      { from: 'Mumbai', to: 'Goa', fare: 800 },
      { from: 'Delhi', to: 'Jaipur', fare: 450 }
    ];

    for (let i = 0; i < 500; i++) {
      const route = routes[i % routes.length];
      const departure = new Date(tomorrow.getTime() + (i * 30 * 60 * 1000)); // 30 min apart
      const arrival = new Date(departure.getTime() + 4 * 60 * 60 * 1000); // 4 hours journey

      simpleBuses.push({
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
        type: 'AC Sleeper',
        rating: 4.2,
        operator: 'BookMySeat Express',
        busNumber: `MH${12 + i}AB${1000 + i}`,
        status: 'On Time',
        amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop'
      });
    }

    await Bus.insertMany(simpleBuses);
    console.log(`✅ Created ${simpleBuses.length} buses successfully`);

    // Verify buses exist
    const count = await Bus.countDocuments();
    console.log(`✅ Total buses in database: ${count}`);

    // Show sample bus
    const sample = await Bus.findOne();
    console.log('Sample bus:', {
      id: sample.id,
      name: sample.name,
      from: sample.from,
      to: sample.to,
      departure: sample.departure
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixBusesNow();