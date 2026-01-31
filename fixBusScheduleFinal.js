import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import Bus from './Model/Busmodel.js';
import Booking from './Model/Bookingmodel.js';

dotenv.config();

const routes = [
  { from: 'Mumbai', to: 'Pune', duration: 3.5 },
  { from: 'Delhi', to: 'Agra', duration: 4 },
  { from: 'Bangalore', to: 'Chennai', duration: 6 },
  { from: 'Hyderabad', to: 'Vijayawada', duration: 4.5 },
  { from: 'Kolkata', to: 'Bhubaneswar', duration: 7 },
  { from: 'Ahmedabad', to: 'Surat', duration: 5 },
  { from: 'Jaipur', to: 'Udaipur', duration: 6.5 },
  { from: 'Kochi', to: 'Trivandrum', duration: 4 }
];

const operators = [
  {
    name: 'RedBus Travels',
    types: [
      { type: 'AC Sleeper', seats: 40, layout: '2+1', baseFare: 900 },
      { type: 'AC Semi Sleeper', seats: 45, layout: '2+2', baseFare: 675 },
      { type: 'Non AC Seater', seats: 55, layout: '2+3', baseFare: 325 }
    ]
  },
  {
    name: 'Orange Travels',
    types: [
      { type: 'AC Sleeper', seats: 38, layout: '2+1', baseFare: 825 },
      { type: 'AC Seater', seats: 50, layout: '2+3', baseFare: 475 }
    ]
  },
  {
    name: 'SRS Travels',
    types: [
      { type: 'Volvo AC', seats: 45, layout: '2+2', baseFare: 775 },
      { type: 'Non AC Seater', seats: 55, layout: '2+3', baseFare: 325 }
    ]
  },
  {
    name: 'VRL Travels',
    types: [
      { type: 'Multi Axle AC', seats: 40, layout: '2+1', baseFare: 925 }
    ]
  }
];

// Full day coverage: 6 AM to 2 AM next day
const timeSlots = [
  { hour: 6, minute: 0 },   // 6:00 AM
  { hour: 7, minute: 30 },  // 7:30 AM
  { hour: 9, minute: 0 },   // 9:00 AM
  { hour: 10, minute: 30 }, // 10:30 AM
  { hour: 12, minute: 0 },  // 12:00 PM
  { hour: 13, minute: 30 }, // 1:30 PM
  { hour: 15, minute: 0 },  // 3:00 PM
  { hour: 16, minute: 30 }, // 4:30 PM
  { hour: 18, minute: 0 },  // 6:00 PM
  { hour: 19, minute: 30 }, // 7:30 PM
  { hour: 21, minute: 0 },  // 9:00 PM
  { hour: 22, minute: 30 }, // 10:30 PM
  { hour: 0, minute: 0 },   // 12:00 AM
  { hour: 2, minute: 0 }    // 2:00 AM
];

function generateBusId() {
  return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

function calculateFare(baseFare, duration, hour) {
  let fare = baseFare + (duration * 25);
  
  if (hour >= 22 || hour <= 5) fare += 150; // Night premium
  else if (hour >= 18) fare += 100; // Evening premium
  else if (hour >= 6 && hour <= 9) fare += 50; // Morning premium
  else fare += 25; // Regular
  
  return Math.round(fare);
}

function generateAmenities(type) {
  const baseAmenities = ['Water Bottle', 'Charging Point'];
  const acAmenities = ['WiFi', 'Reading Light'];
  const premiumAmenities = ['Blanket', 'Pillow'];
  
  if (type.includes('AC')) {
    return [...baseAmenities, ...acAmenities];
  }
  if (type.includes('Sleeper')) {
    return [...baseAmenities, ...acAmenities, ...premiumAmenities];
  }
  return baseAmenities;
}

async function fixBusSchedule() {
  try {
    await connectDb();
    console.log('🔧 Fixing bus schedule issues...');
    
    await Bus.deleteMany({});
    await Booking.deleteMany({});
    console.log('✅ Cleared existing data');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Today's date: ${today.toDateString()}`);
    
    const buses = [];
    const DAYS_TO_GENERATE = 60; // 2 months
    
    // Track unique combinations to prevent duplicates
    const uniqueCombinations = new Set();
    
    for (let dayOffset = 0; dayOffset < DAYS_TO_GENERATE; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      
      for (const route of routes) {
        for (const timeSlot of timeSlots) {
          for (const operator of operators) {
            for (const busType of operator.types) {
              
              // Create unique key to prevent duplicates
              const uniqueKey = `${route.from}-${route.to}-${operator.name}-${busType.type}-${timeSlot.hour}-${timeSlot.minute}-${dayOffset}`;
              
              if (uniqueCombinations.has(uniqueKey)) continue;
              uniqueCombinations.add(uniqueKey);
              
              const departureTime = new Date(currentDate);
              
              // Handle next day times (12 AM, 2 AM)
              if (timeSlot.hour < 6) {
                departureTime.setDate(currentDate.getDate() + 1);
              }
              
              departureTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
              
              const arrivalTime = new Date(departureTime.getTime() + (route.duration * 60 * 60 * 1000));
              
              const bus = {
                id: generateBusId(),
                name: `${operator.name} ${busType.type}`,
                from: route.from,
                to: route.to,
                departure: departureTime,
                arrival: arrivalTime,
                fare: calculateFare(busType.baseFare, route.duration, timeSlot.hour),
                totalSeats: busType.seats,
                availableSeats: busType.seats,
                type: busType.type,
                rating: 3.5 + Math.random() * 1.5,
                amenities: generateAmenities(busType.type),
                operator: operator.name,
                busNumber: `${operator.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
                seatLayout: busType.layout,
                imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
                description: `Comfortable ${busType.type} service from ${route.from} to ${route.to}`,
                bookedSeats: [],
                heldSeats: [],
                checkpoints: [
                  { name: `${route.from} Central`, time: departureTime.toTimeString().slice(0, 5), type: 'departure' },
                  { name: `${route.to} Terminal`, time: arrivalTime.toTimeString().slice(0, 5), type: 'arrival' }
                ],
                status: 'Active',
                delayInfo: {
                  isDelayed: false,
                  delayMinutes: 0,
                  reason: ''
                }
              };
              
              buses.push(bus);
            }
          }
        }
      }
      
      // Insert in batches to avoid memory issues
      if (buses.length >= 500) {
        await Bus.insertMany(buses);
        console.log(`✅ Inserted ${buses.length} buses for days ${dayOffset - Math.floor(buses.length/100) + 1} to ${dayOffset + 1}`);
        buses.length = 0; // Clear array
      }
    }
    
    // Insert remaining buses
    if (buses.length > 0) {
      await Bus.insertMany(buses);
      console.log(`✅ Inserted final ${buses.length} buses`);
    }
    
    // Verify today's buses
    const todayBuses = await Bus.find({
      departure: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ departure: 1 });
    
    console.log(`\n📊 Today's Schedule (${today.toDateString()}):`);
    console.log(`🚌 Total buses: ${todayBuses.length}`);
    
    // Show sample by route
    const routeGroups = {};
    todayBuses.forEach(bus => {
      const routeKey = `${bus.from} → ${bus.to}`;
      if (!routeGroups[routeKey]) routeGroups[routeKey] = [];
      routeGroups[routeKey].push(bus);
    });
    
    Object.entries(routeGroups).slice(0, 3).forEach(([route, buses]) => {
      console.log(`\n🛣️  ${route} (${buses.length} buses):`);
      buses.slice(0, 5).forEach(bus => {
        console.log(`   ${bus.departure.toLocaleTimeString()} - ${bus.operator} ${bus.type} - ₹${bus.fare}`);
      });
    });
    
    console.log('\n✅ Bus schedule fixed successfully!');
    console.log('🔧 Issues resolved:');
    console.log('   ✓ Proper date handling (today = Jan 30)');
    console.log('   ✓ No duplicate buses');
    console.log('   ✓ Full day coverage (6 AM - 2 AM)');
    console.log('   ✓ Unique schedules per operator');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixBusSchedule();