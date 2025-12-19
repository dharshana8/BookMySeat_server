import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import Bus from './Model/Busmodel.js';
import Booking from './Model/Bookingmodel.js';

dotenv.config();

// Bus routes data
const routes = [
  { from: 'Mumbai', to: 'Pune' },
  { from: 'Delhi', to: 'Agra' },
  { from: 'Bangalore', to: 'Chennai' },
  { from: 'Hyderabad', to: 'Vijayawada' },
  { from: 'Kolkata', to: 'Bhubaneswar' },
  { from: 'Ahmedabad', to: 'Surat' },
  { from: 'Jaipur', to: 'Udaipur' },
  { from: 'Kochi', to: 'Trivandrum' }
];

// Bus operators and types
const busData = [
  {
    name: 'Volvo Multi-Axle',
    type: 'AC Sleeper',
    operator: 'RedBus Travels',
    seatLayout: '2+1',
    totalSeats: 40,
    amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Pillow'],
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop'
  },
  {
    name: 'Scania Multi-Axle',
    type: 'AC Semi Sleeper',
    operator: 'Orange Travels',
    seatLayout: '2+2',
    totalSeats: 45,
    amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Reading Light'],
    rating: 4.3,
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=250&fit=crop'
  },
  {
    name: 'Mercedes Multi-Axle',
    type: 'Non AC Seater',
    operator: 'SRS Travels',
    seatLayout: '2+3',
    totalSeats: 50,
    amenities: ['Charging Point', 'Water Bottle'],
    rating: 4.0,
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop'
  },
  {
    name: 'Ashok Leyland',
    type: 'AC Seater',
    operator: 'VRL Travels',
    seatLayout: '2+2',
    totalSeats: 42,
    amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Snacks'],
    rating: 4.2,
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=250&fit=crop'
  }
];

// Time slots for departures
const timeSlots = [
  { departure: '06:00', duration: 4 }, // 4 hours journey
  { departure: '09:30', duration: 4.5 },
  { departure: '14:00', duration: 4 },
  { departure: '18:30', duration: 5 },
  { departure: '22:00', duration: 6 }, // Night journey
  { departure: '23:30', duration: 6.5 }
];

function generateBusId() {
  return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

function calculateArrival(departureTime, durationHours) {
  const [hours, minutes] = departureTime.split(':').map(Number);
  const depDate = new Date();
  depDate.setHours(hours, minutes, 0, 0);
  
  const arrDate = new Date(depDate.getTime() + (durationHours * 60 * 60 * 1000));
  return arrDate.toTimeString().slice(0, 5);
}

function calculateFare(type, duration) {
  const baseFare = {
    'AC Sleeper': 800,
    'AC Semi Sleeper': 600,
    'AC Seater': 400,
    'Non AC Seater': 250
  };
  
  return Math.round(baseFare[type] + (duration * 50));
}

function generateCheckpoints(from, to) {
  const checkpointSets = {
    'Mumbai-Pune': [
      { name: 'Lonavala', time: '07:30', type: 'stop' },
      { name: 'Khandala', time: '08:00', type: 'stop' }
    ],
    'Delhi-Agra': [
      { name: 'Faridabad', time: '07:00', type: 'stop' },
      { name: 'Mathura', time: '09:30', type: 'stop' }
    ],
    'Bangalore-Chennai': [
      { name: 'Hosur', time: '07:30', type: 'stop' },
      { name: 'Krishnagiri', time: '09:00', type: 'stop' }
    ]
  };
  
  return checkpointSets[`${from}-${to}`] || [
    { name: `${from} Junction`, time: '07:00', type: 'stop' },
    { name: `${to} Outskirts`, time: '09:00', type: 'stop' }
  ];
}

async function seedBuses() {
  try {
    await connectDb();
    
    console.log('🚌 Starting bus seeding process...');
    
    // Clear existing buses and bookings
    await Bus.deleteMany({});
    await Booking.deleteMany({});
    console.log('✅ Cleared existing buses and bookings');
    
    const buses = [];
    const today = new Date();
    
    // Generate buses for next 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      
      // For each route
      for (const route of routes) {
        // For each time slot
        for (const timeSlot of timeSlots) {
          // For each bus type (2 buses per time slot)
          for (let busIndex = 0; busIndex < 2; busIndex++) {
            const busTemplate = busData[busIndex % busData.length];
            const arrivalTime = calculateArrival(timeSlot.departure, timeSlot.duration);
            
            // Create departure and arrival datetime objects
            const departureDateTime = new Date(currentDate);
            const [depHours, depMinutes] = timeSlot.departure.split(':').map(Number);
            departureDateTime.setHours(depHours, depMinutes, 0, 0);
            
            const arrivalDateTime = new Date(departureDateTime.getTime() + (timeSlot.duration * 60 * 60 * 1000));
            
            const bus = {
              id: generateBusId(),
              name: busTemplate.name,
              from: route.from,
              to: route.to,
              departure: departureDateTime,
              arrival: arrivalDateTime,
              fare: calculateFare(busTemplate.type, timeSlot.duration),
              totalSeats: busTemplate.totalSeats,
              availableSeats: busTemplate.totalSeats,
              type: busTemplate.type,
              rating: busTemplate.rating,
              amenities: busTemplate.amenities,
              operator: busTemplate.operator,
              busNumber: `${busTemplate.operator.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
              seatLayout: busTemplate.seatLayout,
              imageUrl: busTemplate.imageUrl,
              description: `Comfortable ${busTemplate.type} bus from ${route.from} to ${route.to}. Journey time: ${timeSlot.duration} hours.`,
              bookedSeats: [],
              checkpoints: generateCheckpoints(route.from, route.to),
              status: 'Active'
            };
            
            buses.push(bus);
          }
        }
      }
    }
    
    // Insert all buses
    await Bus.insertMany(buses);
    
    console.log(`✅ Created ${buses.length} buses successfully!`);
    console.log(`📊 Routes: ${routes.length}`);
    console.log(`📅 Days: 30`);
    console.log(`⏰ Time slots per route per day: ${timeSlots.length * 2}`);
    console.log(`🚌 Total buses per day: ${routes.length * timeSlots.length * 2}`);
    
    // Show sample data
    console.log('\n📋 Sample Bus Data:');
    console.log('='.repeat(60));
    const sampleBuses = buses.slice(0, 3);
    sampleBuses.forEach(bus => {
      console.log(`🚌 ${bus.name} (${bus.type})`);
      console.log(`   Route: ${bus.from} → ${bus.to}`);
      console.log(`   Departure: ${bus.departure.toLocaleString()}`);
      console.log(`   Arrival: ${bus.arrival.toLocaleString()}`);
      console.log(`   Fare: ₹${bus.fare}`);
      console.log(`   Operator: ${bus.operator}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding buses:', err);
    process.exit(1);
  }
}

seedBuses();