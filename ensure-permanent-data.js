import mongoose from 'mongoose';
import User from './Model/Usermodel.js';
import Bus from './Model/Busmodel.js';
import Coupon from './Model/Couponmodel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bus_tbooking';

async function ensurePermanentStorage() {
  try {
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB');

    // Check and create permanent data
    const busCount = await Bus.countDocuments();
    const userCount = await User.countDocuments();
    const couponCount = await Coupon.countDocuments();

    console.log(`📊 Current data: ${busCount} buses, ${userCount} users, ${couponCount} coupons`);

    // Always ensure users exist
    const users = [
      { name: 'System Admin', email: 'admin@bookmyseat.com', password: 'admin123', role: 'admin' },
      { name: 'Dharsh Kumar', email: 'dharsh@bookmyseat.com', password: 'dharsh123', role: 'admin' },
      { name: 'Demo User', email: 'user@demo.com', password: 'user123', role: 'user' }
    ];
    
    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const hashed = await bcrypt.hash(userData.password, 10);
        await User.create({ ...userData, password: hashed });
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    // Always ensure coupons exist
    const existingCoupons = await Coupon.find();
    if (existingCoupons.length === 0) {
      const coupons = [
        { code: "FIRST10", discount: 10, type: "percentage", minAmount: 200, maxDiscount: 100, expiryDate: new Date('2030-12-31'), isActive: true },
        { code: "SAVE50", discount: 50, type: "fixed", minAmount: 300, maxDiscount: 50, expiryDate: new Date('2030-12-31'), isActive: true },
        { code: "WEEKEND20", discount: 20, type: "percentage", minAmount: 400, maxDiscount: 200, expiryDate: new Date('2030-12-31'), isActive: true },
        { code: "STUDENT15", discount: 15, type: "percentage", minAmount: 250, maxDiscount: 150, expiryDate: new Date('2030-12-31'), isActive: true }
      ];
      await Coupon.insertMany(coupons);
      console.log('✅ Created permanent coupons');
    }

    // Generate buses with proper dates if needed
    if (busCount === 0) {
      console.log('🚌 Generating permanent bus data...');
      const buses = generatePermanentBuses();
      
      const batchSize = 500;
      for (let i = 0; i < buses.length; i += batchSize) {
        const batch = buses.slice(i, i + batchSize);
        await Bus.insertMany(batch);
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(buses.length/batchSize)}`);
      }
      console.log(`✅ Created ${buses.length} permanent buses`);
    }

    const finalCount = await Bus.countDocuments();
    console.log(`🎉 PERMANENT DATA READY: ${finalCount} buses available`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function generatePermanentBuses() {
  const buses = [];
  const now = new Date();
  
  const routes = [
    { from: 'Mumbai', to: 'Pune', distance: 150, duration: 3.5 },
    { from: 'Delhi', to: 'Agra', distance: 230, duration: 4 },
    { from: 'Bangalore', to: 'Chennai', distance: 350, duration: 6 },
    { from: 'Hyderabad', to: 'Vijayawada', distance: 275, duration: 5 },
    { from: 'Kolkata', to: 'Bhubaneswar', distance: 440, duration: 7 },
    { from: 'Ahmedabad', to: 'Surat', distance: 265, duration: 4.5 },
    { from: 'Chennai', to: 'Bangalore', distance: 350, duration: 6 },
    { from: 'Pune', to: 'Mumbai', distance: 150, duration: 3.5 }
  ];
  
  const operators = [
    { name: 'RedBus Travels', types: [{ type: 'AC Sleeper', seats: 40, fare: 800 }, { type: 'AC Semi Sleeper', seats: 45, fare: 600 }] },
    { name: 'Orange Travels', types: [{ type: 'AC Sleeper', seats: 38, fare: 750 }, { type: 'AC Seater', seats: 50, fare: 400 }] },
    { name: 'SRS Travels', types: [{ type: 'Volvo AC', seats: 45, fare: 700 }, { type: 'Non AC Seater', seats: 55, fare: 250 }] },
    { name: 'VRL Travels', types: [{ type: 'Multi Axle AC', seats: 40, fare: 850 }, { type: 'AC Semi Sleeper', seats: 42, fare: 550 }] }
  ];
  
  const timeSlots = ['06:00', '12:00', '18:00', '23:00'];
  
  // Generate for next 365 days
  for (let day = 0; day < 365; day++) {
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day);
    
    routes.forEach(route => {
      operators.forEach(operator => {
        operator.types.forEach(busType => {
          timeSlots.forEach(timeSlot => {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const departureDateTime = new Date(currentDate);
            departureDateTime.setHours(hours, minutes, 0, 0);
            
            const arrivalDateTime = new Date(departureDateTime.getTime() + (route.duration * 60 * 60 * 1000));
            
            buses.push({
              id: `BUS-${departureDateTime.getTime()}-${Math.random().toString(36).substr(2, 5)}`,
              name: `${operator.name} ${busType.type}`,
              from: route.from,
              to: route.to,
              departure: departureDateTime,
              arrival: arrivalDateTime,
              fare: busType.fare + (route.distance * 0.5),
              totalSeats: busType.seats,
              availableSeats: busType.seats,
              type: busType.type,
              rating: 4.0 + Math.random() * 0.5,
              operator: operator.name,
              busNumber: `${operator.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
              seatLayout: busType.seats > 45 ? '2+3' : busType.seats > 40 ? '2+2' : '2+1',
              amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
              imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
              description: `Comfortable ${busType.type} service from ${route.from} to ${route.to}`,
              bookedSeats: [],
              heldSeats: [],
              status: 'Active',
              checkpoints: [
                { name: route.from, time: timeSlot, type: 'start' },
                { name: route.to, time: arrivalDateTime.toTimeString().slice(0, 5), type: 'end' }
              ]
            });
          });
        });
      });
    });
  }
  
  return buses;
}

ensurePermanentStorage();