import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function setupAtlasRealTime() {
  try {
    // Connect to Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌐 Connected to MongoDB Atlas');
    console.log('🔧 Setting up real-time bus system on Atlas...');
    
    // Get current system date and time
    const TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);
    
    console.log(`📅 Current system date: ${TODAY.toDateString()}`);
    console.log(`⏰ Current system time: ${new Date().toLocaleTimeString()}`);
    
    // Clear existing data
    await Bus.deleteMany({});
    console.log('✅ Cleared old Atlas data');
    
    const routes = [
      { from: 'Mumbai', to: 'Pune', duration: 3.5 },
      { from: 'Delhi', to: 'Agra', duration: 4 },
      { from: 'Bangalore', to: 'Chennai', duration: 6 },
      { from: 'Hyderabad', to: 'Vijayawada', duration: 4.5 },
      { from: 'Pune', to: 'Mumbai', duration: 3.5 },
      { from: 'Agra', to: 'Delhi', duration: 4 },
      { from: 'Chennai', to: 'Bangalore', duration: 6 },
      { from: 'Vijayawada', to: 'Hyderabad', duration: 4.5 }
    ];
    
    const operators = [
      { name: 'RedBus Travels', type: 'AC Sleeper', seats: 40, fare: 900 },
      { name: 'Orange Travels', type: 'AC Seater', seats: 50, fare: 600 },
      { name: 'SRS Travels', type: 'Volvo AC', seats: 45, fare: 800 },
      { name: 'VRL Travels', type: 'Multi Axle AC', seats: 42, fare: 750 }
    ];
    
    const times = [
      { h: 5, m: 30 }, { h: 6, m: 45 }, { h: 8, m: 15 }, { h: 9, m: 30 },
      { h: 11, m: 0 }, { h: 12, m: 45 }, { h: 14, m: 30 }, { h: 16, m: 15 },
      { h: 17, m: 45 }, { h: 19, m: 30 }, { h: 21, m: 0 }, { h: 22, m: 30 },
      { h: 23, m: 45 }, { h: 1, m: 15 }, { h: 2, m: 30 }, { h: 3, m: 45 }
    ];
    
    const buses = [];
    
    // Generate buses for next 60 days
    for (let day = 0; day < 60; day++) {
      const currentDate = new Date(TODAY);
      currentDate.setDate(TODAY.getDate() + day);
      
      for (const route of routes) {
        for (const time of times) {
          for (const op of operators) {
            const departure = new Date(currentDate);
            
            if (time.h < 5) {
              departure.setDate(currentDate.getDate() + 1);
            }
            
            departure.setHours(time.h, time.m, 0, 0);
            
            // Skip past buses for today
            const now = new Date();
            if (day === 0 && departure <= now) {
              continue;
            }
            
            const arrival = new Date(departure.getTime() + (route.duration * 60 * 60 * 1000));
            
            buses.push({
              id: `BUS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: `${op.name} ${op.type}`,
              from: route.from,
              to: route.to,
              departure: departure,
              arrival: arrival,
              fare: op.fare + (route.duration * 25) + Math.floor(Math.random() * 200),
              totalSeats: op.seats,
              availableSeats: op.seats - Math.floor(Math.random() * 10),
              type: op.type,
              rating: 3.8 + Math.random() * 1.4,
              amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'AC', 'Reading Light'],
              operator: op.name,
              busNumber: `${op.name.substring(0, 2).toUpperCase()}-${1000 + Math.floor(Math.random() * 9000)}`,
              seatLayout: '2+2',
              imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
              description: `${op.type} service from ${route.from} to ${route.to}`,
              bookedSeats: [],
              heldSeats: [],
              checkpoints: [
                { name: `${route.from} Central`, time: departure.toTimeString().slice(0, 5), type: 'departure' },
                { name: `${route.to} Terminal`, time: arrival.toTimeString().slice(0, 5), type: 'arrival' }
              ],
              status: 'Active',
              delayInfo: { isDelayed: false, delayMinutes: 0, reason: '' }
            });
          }
        }
      }
    }
    
    // Insert in batches for Atlas
    const batchSize = 1000;
    for (let i = 0; i < buses.length; i += batchSize) {
      const batch = buses.slice(i, i + batchSize);
      await Bus.insertMany(batch);
      console.log(`📦 Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(buses.length/batchSize)}`);
    }
    
    console.log(`✅ Created ${buses.length} buses on Atlas`);
    
    // Verify setup
    const now = new Date();
    const todayBuses = await Bus.find({
      departure: {
        $gte: now,
        $lt: new Date(TODAY.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ departure: 1 }).limit(5);
    
    console.log(`\n🎯 Next 5 buses available on Atlas:`);
    todayBuses.forEach(bus => {
      const timeUntil = Math.round((new Date(bus.departure) - now) / (1000 * 60));
      console.log(`   ${bus.departure.toLocaleTimeString()} (${timeUntil}min) - ${bus.from} → ${bus.to} - ${bus.operator}`);
    });
    
    console.log('\n✅ ATLAS REAL-TIME SETUP COMPLETED!');
    console.log('🌐 Your bus booking system is now live on Atlas');
    console.log('🔄 Real-time filtering active');
    console.log('📱 Ready for deployment/demo');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Atlas setup error:', err);
    process.exit(1);
  }
}

setupAtlasRealTime();