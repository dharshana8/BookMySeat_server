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
      { type: 'AC Sleeper', seats: 40, layout: '2+1', baseFare: 900, timeOffset: 0 },
      { type: 'AC Semi Sleeper', seats: 45, layout: '2+2', baseFare: 675, timeOffset: 30 },
      { type: 'Non AC Seater', seats: 55, layout: '2+3', baseFare: 325, timeOffset: 60 }
    ]
  },
  {
    name: 'Orange Travels',
    types: [
      { type: 'AC Sleeper', seats: 38, layout: '2+1', baseFare: 825, timeOffset: 45 },
      { type: 'AC Seater', seats: 50, layout: '2+3', baseFare: 475, timeOffset: 75 },
      { type: 'Multi Axle AC', seats: 42, layout: '2+2', baseFare: 775, timeOffset: 105 }
    ]
  },
  {
    name: 'SRS Travels',
    types: [
      { type: 'Volvo AC', seats: 45, layout: '2+2', baseFare: 775, timeOffset: 90 },
      { type: 'Non AC Seater', seats: 55, layout: '2+3', baseFare: 325, timeOffset: 120 },
      { type: 'AC Semi Sleeper', seats: 48, layout: '2+2', baseFare: 625, timeOffset: 150 }
    ]
  },
  {
    name: 'VRL Travels',
    types: [
      { type: 'Multi Axle AC', seats: 40, layout: '2+1', baseFare: 925, timeOffset: 135 },
      { type: 'AC Semi Sleeper', seats: 42, layout: '2+2', baseFare: 625, timeOffset: 165 },
      { type: 'Volvo AC', seats: 44, layout: '2+2', baseFare: 775, timeOffset: 195 }
    ]
  }
];

const timeSlots = [
  { hour: 0, minute: 30, period: 'night' },    // 12:30 AM
  { hour: 6, minute: 30, period: 'morning' },  // 6:30 AM
  { hour: 12, minute: 30, period: 'afternoon' }, // 12:30 PM
  { hour: 17, minute: 30, period: 'evening' }   // 5:30 PM
];

function generateBusId() {
  return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

function calculateFare(baseFare, duration, period) {
  let fare = baseFare + (duration * 25);
  if (period === 'evening' || period === 'night') fare += 100;
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

async function seedBusesWithVariedTimings() {
  try {
    await connectDb();
    console.log('🚌 Starting improved bus seeding...');
    
    await Bus.deleteMany({});
    await Booking.deleteMany({});
    console.log('✅ Cleared existing data');
    
    const buses = [];
    const startDate = new Date('2026-01-30'); // Today's date
    
    // Generate buses for next 365 days
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      
      for (const route of routes) {
        for (const timeSlot of timeSlots) {
          for (const operator of operators) {
            for (const busType of operator.types) {
              // Calculate varied departure time
              const departureTime = new Date(currentDate);
              const adjustedHour = (timeSlot.hour + Math.floor(busType.timeOffset / 60)) % 24;
              const adjustedMinute = (timeSlot.minute + (busType.timeOffset % 60)) % 60;
              
              departureTime.setHours(adjustedHour, adjustedMinute, 0, 0);
              
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
                rating: 4.0 + Math.random() * 0.5,
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
    console.log(`📅 Date range: ${startDate.toDateString()} to ${new Date(startDate.getTime() + 364 * 24 * 60 * 60 * 1000).toDateString()}`);
    console.log(`🚌 Buses per day: ${routes.length * timeSlots.length * operators.length * 3}`);
    
    // Show today's sample buses
    const todayBuses = buses.filter(bus => 
      bus.departure.toDateString() === startDate.toDateString()
    ).slice(0, 5);
    
    console.log('\n📋 Today\'s Sample Buses (Jan 30, 2026):');
    console.log('='.repeat(70));
    todayBuses.forEach(bus => {
      console.log(`🚌 ${bus.name}`);
      console.log(`   ${bus.from} → ${bus.to}`);
      console.log(`   Departure: ${bus.departure.toLocaleTimeString()} | Arrival: ${bus.arrival.toLocaleTimeString()}`);
      console.log(`   Fare: ₹${bus.fare} | Seats: ${bus.totalSeats}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedBusesWithVariedTimings();