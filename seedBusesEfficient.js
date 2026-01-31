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
  }
];

// Realistic time slots throughout the day
const timeSlots = [
  { hour: 6, minute: 0, period: 'morning' },      // 6:00 AM
  { hour: 8, minute: 30, period: 'morning' },     // 8:30 AM
  { hour: 11, minute: 0, period: 'late_morning' }, // 11:00 AM
  { hour: 14, minute: 30, period: 'afternoon' },   // 2:30 PM
  { hour: 17, minute: 0, period: 'evening' },      // 5:00 PM
  { hour: 20, minute: 30, period: 'night' },       // 8:30 PM
  { hour: 23, minute: 0, period: 'late_night' }    // 11:00 PM
];

// Daily services (guaranteed every day)
const dailyServices = [
  { operatorIndex: 0, typeIndex: 0, timeSlotIndex: 0 }, // RedBus AC Sleeper 6:00 AM
  { operatorIndex: 1, typeIndex: 0, timeSlotIndex: 4 }, // Orange AC Sleeper 5:00 PM
  { operatorIndex: 2, typeIndex: 0, timeSlotIndex: 5 }  // SRS Volvo 8:30 PM
];

function generateBusId() {
  return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

function calculateFare(baseFare, duration, period) {
  let fare = baseFare + (duration * 25);
  
  switch(period) {
    case 'late_night':
      fare += 150;
      break;
    case 'evening':
    case 'night':
      fare += 100;
      break;
    case 'morning':
      fare += 50;
      break;
    default:
      fare += 25;
  }
  
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

function isDailyService(operatorIndex, typeIndex, timeSlotIndex) {
  return dailyServices.some(service => 
    service.operatorIndex === operatorIndex && 
    service.typeIndex === typeIndex && 
    service.timeSlotIndex === timeSlotIndex
  );
}

async function seedBusesInBatches() {
  try {
    await connectDb();
    console.log('🚌 Starting efficient bus seeding with today\'s date...');
    
    await Bus.deleteMany({});
    await Booking.deleteMany({});
    console.log('✅ Cleared existing data');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Using today's date: ${today.toDateString()}`);
    
    let totalBuses = 0;
    const BATCH_SIZE = 100;
    const DAYS_TO_GENERATE = 30; // Reduced from 365 for better performance
    
    // Process in batches to avoid memory issues
    for (let dayOffset = 0; dayOffset < DAYS_TO_GENERATE; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      
      const dayBuses = [];
      
      for (let routeIndex = 0; routeIndex < routes.length; routeIndex++) {
        const route = routes[routeIndex];
        
        for (let timeSlotIndex = 0; timeSlotIndex < timeSlots.length; timeSlotIndex++) {
          const timeSlot = timeSlots[timeSlotIndex];
          
          for (let operatorIndex = 0; operatorIndex < operators.length; operatorIndex++) {
            const operator = operators[operatorIndex];
            
            for (let typeIndex = 0; typeIndex < operator.types.length; typeIndex++) {
              const busType = operator.types[typeIndex];
              
              // Skip some buses for variety (except daily services)
              if (!isDailyService(operatorIndex, typeIndex, timeSlotIndex)) {
                if (dayOffset > 0 && Math.random() < 0.4) continue;
              }
              
              const departureTime = new Date(currentDate);
              departureTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
              
              // Add realistic variation (±10 minutes)
              const variation = (Math.random() - 0.5) * 20;
              departureTime.setMinutes(departureTime.getMinutes() + variation);
              
              const arrivalTime = new Date(departureTime.getTime() + (route.duration * 60 * 60 * 1000));
              
              const bus = {
                id: generateBusId(),
                name: `${operator.name} ${busType.type}`,
                from: route.from,
                to: route.to,
                departure: departureTime,
                arrival: arrivalTime,
                fare: calculateFare(busType.baseFare, route.duration, timeSlot.period),
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
                status: dayOffset === 0 ? 'Active' : (Math.random() > 0.1 ? 'Active' : 'Completed'),
                delayInfo: {
                  isDelayed: false,
                  delayMinutes: 0,
                  reason: ''
                }
              };
              
              dayBuses.push(bus);
            }
          }
        }
      }
      
      // Insert day's buses in batches
      for (let i = 0; i < dayBuses.length; i += BATCH_SIZE) {
        const batch = dayBuses.slice(i, i + BATCH_SIZE);
        await Bus.insertMany(batch);
        totalBuses += batch.length;
      }
      
      console.log(`✅ Day ${dayOffset + 1}/${DAYS_TO_GENERATE} completed - ${dayBuses.length} buses`);
    }
    
    console.log(`\n🎉 Successfully created ${totalBuses} buses!`);
    console.log(`📅 Date range: ${today.toDateString()} to ${new Date(today.getTime() + (DAYS_TO_GENERATE - 1) * 24 * 60 * 60 * 1000).toDateString()}`);
    
    // Show today's buses
    const todayBuses = await Bus.find({
      departure: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ departure: 1 });
    
    console.log(`\n📋 Today's Buses (${today.toDateString()}) - ${todayBuses.length} total:`);
    console.log('='.repeat(80));
    
    // Show sample buses with varied timings
    const sampleRoutes = ['Mumbai → Pune', 'Delhi → Agra', 'Bangalore → Chennai'];
    
    sampleRoutes.forEach(routeKey => {
      const [from, to] = routeKey.split(' → ');
      const routeBuses = todayBuses.filter(bus => bus.from === from && bus.to === to);
      
      if (routeBuses.length > 0) {
        console.log(`\n🛣️  ${routeKey} (${routeBuses.length} buses):`);
        routeBuses.slice(0, 6).forEach(bus => {
          const isDaily = dailyServices.some(service => 
            operators[service.operatorIndex].name === bus.operator &&
            operators[service.operatorIndex].types[service.typeIndex].type === bus.type
          );
          console.log(`   ${bus.departure.toLocaleTimeString()} - ${bus.name} - ₹${bus.fare}${isDaily ? ' (Daily)' : ''}`);
        });
      }
    });
    
    console.log('\n🔄 Daily Services (Available Every Day):');
    console.log('='.repeat(50));
    dailyServices.forEach(service => {
      const operator = operators[service.operatorIndex];
      const busType = operator.types[service.typeIndex];
      const timeSlot = timeSlots[service.timeSlotIndex];
      console.log(`   ${operator.name} ${busType.type} - ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
    });
    
    console.log('\n✅ Bus seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedBusesInBatches();