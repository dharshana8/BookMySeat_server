import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function fixDynamicDates() {
  try {
    await mongoose.connect('mongodb://localhost:27017/bus_tbooking');
    console.log('🔧 Setting up dynamic bus dates based on system time...');
    
    // Get ACTUAL current date from system
    const TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);
    
    console.log(`📅 Current system date: ${TODAY.toDateString()}`);
    console.log(`⏰ Current system time: ${new Date().toLocaleTimeString()}`);
    
    // Delete all existing buses
    await Bus.deleteMany({});
    console.log('✅ Cleared old data');
    
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
    
    // More realistic time slots throughout the day
    const times = [
      { h: 5, m: 30 }, { h: 6, m: 45 }, { h: 8, m: 15 }, { h: 9, m: 30 },
      { h: 11, m: 0 }, { h: 12, m: 45 }, { h: 14, m: 30 }, { h: 16, m: 15 },
      { h: 17, m: 45 }, { h: 19, m: 30 }, { h: 21, m: 0 }, { h: 22, m: 30 },
      { h: 23, m: 45 }, { h: 1, m: 15 }, { h: 2, m: 30 }, { h: 3, m: 45 }
    ];
    
    const buses = [];
    
    // Generate buses for next 60 days starting from TODAY
    for (let day = 0; day < 60; day++) {
      const currentDate = new Date(TODAY);
      currentDate.setDate(TODAY.getDate() + day);
      
      for (const route of routes) {
        for (const time of times) {
          for (const op of operators) {
            const departure = new Date(currentDate);
            
            // Handle next day times (after midnight)
            if (time.h < 5) {
              departure.setDate(currentDate.getDate() + 1);
            }
            
            departure.setHours(time.h, time.m, 0, 0);
            
            // Skip buses that have already departed today
            const now = new Date();
            if (day === 0 && departure <= now) {
              continue; // Skip this bus as it has already departed
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
              availableSeats: op.seats - Math.floor(Math.random() * 10), // Some seats already booked
              type: op.type,
              rating: 3.8 + Math.random() * 1.4, // Random rating between 3.8-5.2
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
    
    // Insert all buses at once
    await Bus.insertMany(buses);
    console.log(`✅ Created ${buses.length} buses`);
    
    // Show today's remaining buses
    const now = new Date();
    const todayBuses = await Bus.find({
      departure: {
        $gte: now, // Only future buses
        $lt: new Date(TODAY.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ departure: 1 });
    
    console.log(`\n🎯 TODAY (${TODAY.toDateString()}) - ${todayBuses.length} buses remaining:`);
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    
    // Show next few buses
    const nextBuses = todayBuses.slice(0, 5);
    console.log(`\n🚌 Next 5 buses available for booking:`);
    nextBuses.forEach(bus => {
      console.log(`   ${bus.departure.toLocaleTimeString()} - ${bus.from} → ${bus.to} - ${bus.operator} - ₹${bus.fare}`);
    });
    
    console.log('\n✅ DYNAMIC DATE SYSTEM SETUP COMPLETED!');
    console.log('📅 Buses are now synchronized with system date and time');
    console.log('⚠️  Past buses are automatically filtered out');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixDynamicDates();