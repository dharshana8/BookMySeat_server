import mongoose from 'mongoose';
import Bus from './Model/Busmodel.js';
import User from './Model/Usermodel.js';
import Coupon from './Model/Couponmodel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function prepareAtlasData() {
  try {
    // Use local MongoDB for preparation
    await mongoose.connect('mongodb://localhost:27017/bus_tbooking_atlas');
    console.log('🔄 PREPARING ATLAS DATA LOCALLY...\n');
    
    // Clear existing data
    await Bus.deleteMany({});
    await User.deleteMany({});
    await Coupon.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // 1. Create Users
    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const hashedUser = await bcrypt.hash('user123', 10);
    const hashedDharsh = await bcrypt.hash('dharsh123', 10);
    
    await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@bookmyseat.com',
        password: hashedAdmin,
        role: 'admin',
        phone: '9876543210'
      },
      {
        name: 'Demo User',
        email: 'user@demo.com',
        password: hashedUser,
        role: 'user',
        phone: '9876543211'
      },
      {
        name: 'Dharsh Admin',
        email: 'dharsh@bookmyseat.com',
        password: hashedDharsh,
        role: 'admin',
        phone: '9876543212'
      }
    ]);
    console.log('✅ Created 3 users');
    
    // 2. Create Coupons
    await Coupon.insertMany([
      {
        code: 'SAVE20',
        discount: 20,
        type: 'percentage',
        minAmount: 500,
        maxDiscount: 200,
        isActive: true,
        expiryDate: new Date('2026-12-31')
      },
      {
        code: 'FLAT100',
        discount: 100,
        type: 'fixed',
        minAmount: 800,
        maxDiscount: 100,
        isActive: true,
        expiryDate: new Date('2026-12-31')
      },
      {
        code: 'FIRST50',
        discount: 50,
        type: 'fixed',
        minAmount: 300,
        maxDiscount: 50,
        isActive: true,
        expiryDate: new Date('2026-12-31')
      }
    ]);
    console.log('✅ Created 3 coupons');
    
    // 3. Create Buses for 6 days: Jan 31 - Feb 5, 2026
    const buses = [];
    const startDate = new Date('2026-01-31');
    
    const routes = [
      { from: 'Mumbai', to: 'Pune', duration: 3.5 },
      { from: 'Delhi', to: 'Agra', duration: 4 },
      { from: 'Bangalore', to: 'Chennai', duration: 6 },
      { from: 'Chennai', to: 'Bangalore', duration: 6 },
      { from: 'Pune', to: 'Mumbai', duration: 3.5 }
    ];
    
    const operators = [
      { name: 'RedBus Travels', type: 'AC Sleeper', seats: 40, fare: 800 },
      { name: 'Orange Travels', type: 'AC Seater', seats: 50, fare: 400 },
      { name: 'SRS Travels', type: 'Volvo AC', seats: 45, fare: 700 }
    ];
    
    const timeSlots = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    
    // Generate buses for 6 days (Jan 31 + 5 extra days)
    for (let day = 0; day < 6; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      routes.forEach(route => {
        operators.forEach(operator => {
          timeSlots.forEach(timeSlot => {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const departureDateTime = new Date(currentDate);
            departureDateTime.setHours(hours, minutes, 0, 0);
            
            const arrivalDateTime = new Date(departureDateTime.getTime() + (route.duration * 60 * 60 * 1000));
            
            buses.push({
              id: `BUS-${departureDateTime.getTime()}-${Math.random().toString(36).substr(2, 5)}`,
              name: `${operator.name} ${operator.type}`,
              from: route.from,
              to: route.to,
              departure: departureDateTime,
              arrival: arrivalDateTime,
              fare: operator.fare,
              totalSeats: operator.seats,
              availableSeats: operator.seats,
              type: operator.type,
              rating: (4.0 + Math.random() * 1).toFixed(1),
              operator: operator.name,
              busNumber: `${operator.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
              amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
              bookedSeats: [],
              status: 'Active'
            });
          });
        });
      });
    }
    
    await Bus.insertMany(buses);
    console.log(`✅ Created ${buses.length} buses for 6 days`);
    
    // Show summary by date
    console.log('\n📅 BUSES BY DATE:');
    for (let day = 0; day < 6; day++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + day);
      
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayBuses = await Bus.find({
        departure: { $gte: dayStart, $lte: dayEnd }
      }).countDocuments();
      
      console.log(`${checkDate.toDateString()}: ${dayBuses} buses`);
    }
    
    console.log('\n✅ ATLAS-READY DATA PREPARED!');
    console.log('\n📋 TO DEPLOY TO ATLAS:');
    console.log('1. Whitelist your IP in Atlas dashboard');
    console.log('2. Update MONGO_URI in .env to Atlas connection');
    console.log('3. Run this script again');
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('admin@bookmyseat.com / admin123');
    console.log('user@demo.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

prepareAtlasData();