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
      { type: 'AC Seater', seats: 50, layout: '2+3', baseFare: 475 },
      { type: 'Multi Axle AC', seats: 42, layout: '2+2', baseFare: 775 }
    ]
  },
  {
    name: 'SRS Travels',
    types: [
      { type: 'Volvo AC', seats: 45, layout: '2+2', baseFare: 775 },
      { type: 'Non AC Seater', seats: 55, layout: '2+3', baseFare: 325 },
      { type: 'AC Semi Sleeper', seats: 48, layout: '2+2', baseFare: 625 }
    ]
  },
  {
    name: 'VRL Travels',
    types: [
      { type: 'Multi Axle AC', seats: 40, layout: '2+1', baseFare: 925 },
      { type: 'AC Semi Sleeper', seats: 42, layout: '2+2', baseFare: 625 },
      { type: 'Volvo AC', seats: 44, layout: '2+2', baseFare: 775 }
    ]
  }
];

// Realistic full-day time slots (24-hour coverage)
const timeSlots = [
  { hour: 5, minute: 30, period: 'early_morning' },   // 5:30 AM
  { hour: 7, minute: 0, period: 'morning' },          // 7:00 AM
  { hour: 9, minute: 15, period: 'morning' },         // 9:15 AM
  { hour: 11, minute: 30, period: 'late_morning' },   // 11:30 AM
  { hour: 13, minute: 45, period: 'afternoon' },      // 1:45 PM
  { hour: 16, minute: 0, period: 'afternoon' },       // 4:00 PM
  { hour: 18, minute: 30, period: 'evening' },        // 6:30 PM
  { hour: 20, minute: 15, period: 'evening' },        // 8:15 PM
  { hour: 22, minute: 0, period: 'night' },           // 10:00 PM
  { hour: 23, minute: 45, period: 'late_night' }      // 11:45 PM
];

// Daily service buses (run every day)
const dailyServices = [
  { operatorIndex: 0, typeIndex: 0, timeSlotIndex: 1 }, // RedBus AC Sleeper 7:00 AM
  { operatorIndex: 1, typeIndex: 2, timeSlotIndex: 6 }, // Orange Multi Axle 6:30 PM
  { operatorIndex: 2, typeIndex: 0, timeSlotIndex: 8 }, // SRS Volvo 10:00 PM
  { operatorIndex: 3, typeIndex: 1, timeSlotIndex: 3 }  // VRL Semi Sleeper 11:30 AM
];

function generateBusId() {
  return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

function calculateFare(baseFare, duration, period) {
  let fare = baseFare + (duration * 25);
  
  // Dynamic pricing based on time
  switch(period) {
    case 'early_morning':
    case 'late_night':
      fare += 150; // Premium for inconvenient hours
      break;
    case 'evening':
    case 'night':
      fare += 100; // Popular evening slots
      break;
    case 'morning':
      fare += 50; // Moderate premium for morning
      break;
    default:
      fare += 25; // Standard pricing
  }
  
  return Math.round(fare);
}

function generateAmenities(type) {
  const baseAmenities = ['Water Bottle', 'Charging Point'];
  const acAmenities = ['WiFi', 'Reading Light', 'Blanket'];
  const premiumAmenities = ['Pillow', 'Snacks', 'Entertainment'];
  
  if (type.includes('AC')) {
    return [...baseAmenities, ...acAmenities.slice(0, 2)];
  }
  if (type.includes('Sleeper') || type.includes('Multi Axle')) {
    return [...baseAmenities, ...acAmenities, ...premiumAmenities.slice(0, 1)];
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

async function seedRealisticBuses() {
  try {
    await connectDb();
    console.log('🚌 Starting realistic bus seeding with today\'s date...');
    
    await Bus.deleteMany({});
    await Booking.deleteMany({});
    console.log('✅ Cleared existing data');
    
    const buses = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    console.log(`📅 Using today's date: ${today.toDateString()}`);
    
    // Generate buses for next 365 days
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      
      for (let routeIndex = 0; routeIndex < routes.length; routeIndex++) {
        const route = routes[routeIndex];
        
        for (let timeSlotIndex = 0; timeSlotIndex < timeSlots.length; timeSlotIndex++) {
          const timeSlot = timeSlots[timeSlotIndex];
          
          for (let operatorIndex = 0; operatorIndex < operators.length; operatorIndex++) {
            const operator = operators[operatorIndex];
            
            for (let typeIndex = 0; typeIndex < operator.types.length; typeIndex++) {
              const busType = operator.types[typeIndex];
              
              // Skip non-daily services on certain days (create variety)
              if (!isDailyService(operatorIndex, typeIndex, timeSlotIndex)) {
                // Skip some buses on weekends or random days for variety
                if (dayOffset > 0 && (Math.random() < 0.3)) continue;
              }
              
              // Create departure time
              const departureTime = new Date(currentDate);
              departureTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
              
              // Add small random variation (±15 minutes) for realism
              const variation = (Math.random() - 0.5) * 30; // -15 to +15 minutes
              departureTime.setMinutes(departureTime.getMinutes() + variation);
              
              // Calculate arrival time
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
                rating: 3.5 + Math.random() * 1.5, // 3.5 to 5.0 rating
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
              
              buses.push(bus);
            }
          }
        }
      }
    }
    
    await Bus.insertMany(buses);
    
    console.log(`✅ Created ${buses.length} buses successfully!`);
    console.log(`📅 Date range: ${today.toDateString()} to ${new Date(today.getTime() + 364 * 24 * 60 * 60 * 1000).toDateString()}`);
    
    // Show today's buses with varied timings
    const todayBuses = buses.filter(bus => 
      bus.departure.toDateString() === today.toDateString()
    ).sort((a, b) => a.departure - b.departure);
    
    console.log(`\n📋 Today's Buses (${today.toDateString()}) - ${todayBuses.length} total:`);
    console.log('='.repeat(80));
    
    // Group by route and show timing variety
    const routeGroups = {};
    todayBuses.forEach(bus => {
      const routeKey = `${bus.from} → ${bus.to}`;
      if (!routeGroups[routeKey]) routeGroups[routeKey] = [];
      routeGroups[routeKey].push(bus);
    });
    
    Object.entries(routeGroups).forEach(([route, buses]) => {
      console.log(`\n🛣️  ${route} (${buses.length} buses):`);
      buses.slice(0, 5).forEach(bus => {
        const isDaily = dailyServices.some(service => 
          operators[service.operatorIndex].name === bus.operator &&
          operators[service.operatorIndex].types[service.typeIndex].type === bus.type
        );
        console.log(`   ${bus.departure.toLocaleTimeString()} - ${bus.name} - ₹${bus.fare}${isDaily ? ' (Daily Service)' : ''}`);
      });
      if (buses.length > 5) {
        console.log(`   ... and ${buses.length - 5} more buses`);
      }
    });
    
    // Show daily services info
    console.log('\n🔄 Daily Services (Available Every Day):');
    console.log('='.repeat(50));
    dailyServices.forEach(service => {
      const operator = operators[service.operatorIndex];
      const busType = operator.types[service.typeIndex];
      const timeSlot = timeSlots[service.timeSlotIndex];
      console.log(`   ${operator.name} ${busType.type} - ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedRealisticBuses();