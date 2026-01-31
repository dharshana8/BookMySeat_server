import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function quickDateFix() {
  try {
    // Use local MongoDB instead of Atlas
    await mongoose.connect('mongodb://localhost:27017/bus_tbooking');
    console.log('⚡ FAST DATE FIX - Starting...');
    
    // Get current date - January 30, 2026
    const TODAY = new Date('2026-01-30');
    TODAY.setHours(0, 0, 0, 0);
    
    console.log(`📅 Setting all buses to start from: ${TODAY.toDateString()}`);
    
    // Delete all existing buses
    await Bus.deleteMany({});
    console.log('✅ Cleared old data');
    
    const routes = [
      { from: 'Mumbai', to: 'Pune', duration: 3.5 },
      { from: 'Delhi', to: 'Agra', duration: 4 },
      { from: 'Bangalore', to: 'Chennai', duration: 6 },
      { from: 'Hyderabad', to: 'Vijayawada', duration: 4.5 }
    ];
    
    const operators = [
      { name: 'RedBus Travels', type: 'AC Sleeper', seats: 40, fare: 900 },
      { name: 'Orange Travels', type: 'AC Seater', seats: 50, fare: 600 },
      { name: 'SRS Travels', type: 'Volvo AC', seats: 45, fare: 800 },
      { name: 'VRL Travels', type: 'Multi Axle AC', seats: 42, fare: 750 }
    ];
    
    // Times from 6 AM to 2 AM next day
    const times = [
      { h: 6, m: 0 }, { h: 8, m: 30 }, { h: 11, m: 0 }, { h: 14, m: 30 },
      { h: 17, m: 0 }, { h: 19, m: 30 }, { h: 22, m: 0 }, { h: 1, m: 30 }
    ];
    
    const buses = [];
    
    // Generate for 30 days starting from TODAY
    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(TODAY);
      currentDate.setDate(TODAY.getDate() + day);
      
      for (const route of routes) {
        for (const time of times) {
          for (const op of operators) {
            const departure = new Date(currentDate);
            
            // Handle next day times (1:30 AM)
            if (time.h < 6) {
              departure.setDate(currentDate.getDate() + 1);
            }
            
            departure.setHours(time.h, time.m, 0, 0);
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
              availableSeats: op.seats,
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
    
    // Insert all buses at once
    await Bus.insertMany(buses);
    console.log(`✅ Created ${buses.length} buses`);
    
    // Verify TODAY's buses
    const todayBuses = await Bus.find({
      departure: {
        $gte: TODAY,
        $lt: new Date(TODAY.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ departure: 1 });
    
    console.log(`\n🎯 TODAY (${TODAY.toDateString()}) - ${todayBuses.length} buses:`);
    
    // Show Mumbai → Pune buses for today
    const mumbaiPune = todayBuses.filter(b => b.from === 'Mumbai' && b.to === 'Pune');
    console.log(`\n🚌 Mumbai → Pune (${mumbaiPune.length} buses):`);
    mumbaiPune.forEach(bus => {
      console.log(`   ${bus.departure.toLocaleTimeString()} - ${bus.operator} ${bus.type} - ₹${bus.fare}`);
    });
    
    console.log('\n✅ FAST FIX COMPLETED!');
    console.log(`📅 All buses now start from: ${TODAY.toDateString()}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

quickDateFix();