import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function setupAtlasLight() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌐 Setting up LIGHT Atlas database...');
    
    const TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);
    
    // Clear old data
    await Bus.deleteMany({});
    console.log('✅ Cleared Atlas data');
    
    // Reduced routes for better performance
    const routes = [
      { from: 'Mumbai', to: 'Pune', duration: 3.5 },
      { from: 'Delhi', to: 'Agra', duration: 4 },
      { from: 'Bangalore', to: 'Chennai', duration: 6 },
      { from: 'Pune', to: 'Mumbai', duration: 3.5 }
    ];
    
    const operators = [
      { name: 'RedBus Travels', type: 'AC Sleeper', seats: 40, fare: 900 },
      { name: 'Orange Travels', type: 'AC Seater', seats: 50, fare: 600 }
    ];
    
    // Fewer time slots for better performance
    const times = [
      { h: 6, m: 0 }, { h: 9, m: 30 }, { h: 14, m: 0 }, 
      { h: 18, m: 30 }, { h: 22, m: 0 }
    ];
    
    const buses = [];
    
    // Only 7 days for demo (not 60)
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(TODAY);
      currentDate.setDate(TODAY.getDate() + day);
      
      for (const route of routes) {
        for (const time of times) {
          for (const op of operators) {
            const departure = new Date(currentDate);
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
              fare: op.fare + (route.duration * 25),
              totalSeats: op.seats,
              availableSeats: op.seats - Math.floor(Math.random() * 5),
              type: op.type,
              rating: 4.2,
              amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
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
    
    // Insert all at once (small dataset)
    await Bus.insertMany(buses);
    console.log(`✅ Created ${buses.length} buses (LIGHT version)`);
    
    // Show sample
    const sampleBuses = await Bus.find({}).limit(5).sort({ departure: 1 });
    console.log(`\n🚌 Sample buses:`);
    sampleBuses.forEach(bus => {
      console.log(`   ${bus.departure.toLocaleString()} - ${bus.from} → ${bus.to} - ${bus.operator}`);
    });
    
    console.log('\n✅ LIGHT ATLAS SETUP COMPLETED!');
    console.log(`📊 Total buses: ${buses.length} (much faster!)`);
    console.log('🚀 Ready for fast demo');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

setupAtlasLight();