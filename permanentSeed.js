import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDb } from './Db/Db.js';
import Bus from './Model/Busmodel.js';
import User from './Model/Usermodel.js';
import Coupon from './Model/Couponmodel.js';

dotenv.config();

// Permanent routes that will always be available
const PERMANENT_ROUTES = [
  { from: 'Mumbai', to: 'Pune', distance: 150, duration: 3.5 },
  { from: 'Delhi', to: 'Agra', distance: 230, duration: 4 },
  { from: 'Bangalore', to: 'Chennai', distance: 350, duration: 6 },
  { from: 'Hyderabad', to: 'Vijayawada', distance: 275, duration: 5 },
  { from: 'Kolkata', to: 'Bhubaneswar', distance: 440, duration: 7 },
  { from: 'Ahmedabad', to: 'Surat', distance: 265, duration: 4.5 },
  { from: 'Jaipur', to: 'Udaipur', distance: 400, duration: 6.5 },
  { from: 'Kochi', to: 'Trivandrum', distance: 200, duration: 4 },
  { from: 'Chennai', to: 'Bangalore', distance: 350, duration: 6 },
  { from: 'Pune', to: 'Mumbai', distance: 150, duration: 3.5 },
  { from: 'Mumbai', to: 'Goa', distance: 600, duration: 10 },
  { from: 'Delhi', to: 'Jaipur', distance: 280, duration: 5 }
];

// Bus operators with their details
const BUS_OPERATORS = [
  {
    name: 'RedBus Travels',
    types: [
      { type: 'AC Sleeper', layout: '2+1', seats: 40, baseFare: 800, amenities: ['WiFi', 'Charging Point', 'Blanket', 'Pillow', 'Water'] },
      { type: 'AC Semi Sleeper', layout: '2+2', seats: 45, baseFare: 600, amenities: ['WiFi', 'Charging Point', 'Water'] }
    ]
  },
  {
    name: 'Orange Travels',
    types: [
      { type: 'AC Sleeper', layout: '2+1', seats: 38, baseFare: 750, amenities: ['WiFi', 'Charging Point', 'Blanket', 'Water'] },
      { type: 'AC Seater', layout: '2+2', seats: 50, baseFare: 400, amenities: ['WiFi', 'Charging Point'] }
    ]
  },
  {
    name: 'SRS Travels',
    types: [
      { type: 'Volvo AC', layout: '2+2', seats: 45, baseFare: 700, amenities: ['WiFi', 'Charging Point', 'Water', 'Snacks'] },
      { type: 'Non AC Seater', layout: '2+3', seats: 55, baseFare: 250, amenities: ['Charging Point'] }
    ]
  },
  {
    name: 'VRL Travels',
    types: [
      { type: 'Multi Axle AC', layout: '2+1', seats: 40, baseFare: 850, amenities: ['WiFi', 'Charging Point', 'Blanket', 'Entertainment'] },
      { type: 'AC Semi Sleeper', layout: '2+2', seats: 42, baseFare: 550, amenities: ['WiFi', 'Charging Point'] }
    ]
  }
];

// Time slots for departures
const TIME_SLOTS = [
  { time: '05:30', label: 'Early Morning' },
  { time: '07:00', label: 'Morning' },
  { time: '09:30', label: 'Late Morning' },
  { time: '12:00', label: 'Noon' },
  { time: '15:00', label: 'Afternoon' },
  { time: '18:00', label: 'Evening' },
  { time: '21:00', label: 'Night' },
  { time: '23:30', label: 'Late Night' }
];

function generateBusId() {
  return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

function calculateArrival(departureTime, durationHours) {
  const [hours, minutes] = departureTime.split(':').map(Number);
  const totalMinutes = (hours * 60) + minutes + (durationHours * 60);
  const arrHours = Math.floor(totalMinutes / 60) % 24;
  const arrMinutes = totalMinutes % 60;
  return `${arrHours.toString().padStart(2, '0')}:${arrMinutes.toString().padStart(2, '0')}`;
}

function calculateFare(baseFare, distance, timeSlot) {
  let fare = baseFare + (distance * 0.5);
  // Night surcharge
  if (timeSlot.time >= '21:00' || timeSlot.time <= '06:00') {
    fare += 100;
  }
  return Math.round(fare);
}

async function createPermanentData() {
  try {
    await connectDb();
    console.log('🔄 Creating permanent data...');

    // 1. Create default users
    const users = [
      { name: 'System Admin', email: 'admin@bookmyseat.com', password: 'admin123', role: 'admin' },
      { name: 'Dharsh Kumar', email: 'dharsh@bookmyseat.com', password: 'dharsh123', role: 'admin' },
      { name: 'Demo User', email: 'user@demo.com', password: 'user123', role: 'user' }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({ ...userData, password: hashedPassword });
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    // 2. Create permanent coupons
    await Coupon.deleteMany({});
    const coupons = [
      {
        code: 'FIRST10',
        discount: 10,
        type: 'percentage',
        minAmount: 200,
        maxDiscount: 100,
        expiryDate: new Date('2030-12-31'),
        isActive: true,
        description: '10% off on first booking'
      },
      {
        code: 'SAVE50',
        discount: 50,
        type: 'fixed',
        minAmount: 300,
        maxDiscount: 50,
        expiryDate: new Date('2030-12-31'),
        isActive: true,
        description: '₹50 off on bookings above ₹300'
      },
      {
        code: 'WEEKEND20',
        discount: 20,
        type: 'percentage',
        minAmount: 400,
        maxDiscount: 200,
        expiryDate: new Date('2030-12-31'),
        isActive: true,
        description: '20% off on weekend bookings'
      },
      {
        code: 'STUDENT15',
        discount: 15,
        type: 'percentage',
        minAmount: 250,
        maxDiscount: 150,
        expiryDate: new Date('2030-12-31'),
        isActive: true,
        description: '15% student discount'
      }
    ];

    await Coupon.insertMany(coupons);
    console.log(`✅ Created ${coupons.length} permanent coupons`);

    // 3. Create buses for next 90 days
    await Bus.deleteMany({});
    const buses = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);

      for (const route of PERMANENT_ROUTES) {
        for (const operator of BUS_OPERATORS) {
          for (const busType of operator.types) {
            for (const timeSlot of TIME_SLOTS) {
              const departureDateTime = new Date(currentDate);
              const [hours, minutes] = timeSlot.time.split(':').map(Number);
              departureDateTime.setHours(hours, minutes, 0, 0);

              const arrivalTime = calculateArrival(timeSlot.time, route.duration);
              const arrivalDateTime = new Date(departureDateTime);
              const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
              arrivalDateTime.setHours(arrHours, arrMinutes, 0, 0);

              // If arrival is next day
              if (arrivalDateTime <= departureDateTime) {
                arrivalDateTime.setDate(arrivalDateTime.getDate() + 1);
              }

              const bus = {
                id: generateBusId(),
                name: `${operator.name} ${busType.type}`,
                from: route.from,
                to: route.to,
                departure: departureDateTime,
                arrival: arrivalDateTime,
                fare: calculateFare(busType.baseFare, route.distance, timeSlot),
                totalSeats: busType.seats,
                availableSeats: busType.seats,
                type: busType.type,
                rating: 4.0 + Math.random() * 0.5,
                amenities: busType.amenities,
                operator: operator.name,
                busNumber: `${operator.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
                seatLayout: busType.layout,
                imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
                description: `Comfortable ${busType.type} service from ${route.from} to ${route.to}`,
                bookedSeats: [],
                heldSeats: [],
                status: 'Active',
                checkpoints: [
                  { name: route.from, time: timeSlot.time, type: 'start' },
                  { name: route.to, time: arrivalTime, type: 'end' }
                ]
              };

              buses.push(bus);
            }
          }
        }
      }
    }

    // Insert buses in batches
    const batchSize = 1000;
    for (let i = 0; i < buses.length; i += batchSize) {
      const batch = buses.slice(i, i + batchSize);
      await Bus.insertMany(batch);
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(buses.length/batchSize)}`);
    }

    console.log(`🎉 PERMANENT DATA CREATED SUCCESSFULLY!`);
    console.log(`📊 Total buses: ${buses.length}`);
    console.log(`🗓️ Days covered: 90`);
    console.log(`🛣️ Routes: ${PERMANENT_ROUTES.length}`);
    console.log(`🚌 Operators: ${BUS_OPERATORS.length}`);
    console.log(`⏰ Time slots: ${TIME_SLOTS.length}`);
    console.log(`🎫 Coupons: ${coupons.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating permanent data:', error);
    process.exit(1);
  }
}

createPermanentData();