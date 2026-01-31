import mongoose from 'mongoose';
import Bus from './Model/Busmodel.js';
import User from './Model/Usermodel.js';
import Coupon from './Model/Couponmodel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function setupPermanentData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus_tbooking');
    console.log('🔄 SETTING UP PERMANENT DATA...');
    
    // Clear all existing data
    await Bus.deleteMany({});
    await User.deleteMany({});
    await Coupon.deleteMany({});
    console.log('✅ Cleared all existing data');
    
    // 1. Create Users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    const dharsPassword = await bcrypt.hash('dharsh123', 10);
    
    await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@bookmyseat.com',
        password: hashedPassword,
        role: 'admin',
        phone: '9876543210'
      },
      {
        name: 'Demo User',
        email: 'user@demo.com',
        password: userPassword,
        role: 'user',
        phone: '9876543211'
      },
      {
        name: 'Dharsh Admin',
        email: 'dharsh@bookmyseat.com',
        password: dharsPassword,
        role: 'admin',
        phone: '9876543212'
      }
    ]);
    console.log('✅ Created 3 users (2 admins, 1 user)');
    
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
    console.log('✅ Created 3 active coupons');
    
    // 3. Create Buses for 30 days (permanent)
    const buses = [];
    const startDate = new Date('2026-01-31');
    
    const routes = [
      { from: 'Mumbai', to: 'Pune', duration: 3.5 },
      { from: 'Delhi', to: 'Agra', duration: 4 },
      { from: 'Bangalore', to: 'Chennai', duration: 6 },
      { from: 'Chennai', to: 'Bangalore', duration: 6 },
      { from: 'Pune', to: 'Mumbai', duration: 3.5 },
      { from: 'Hyderabad', to: 'Bangalore', duration: 8 },
      { from: 'Kolkata', to: 'Bhubaneswar', duration: 7 },
      { from: 'Ahmedabad', to: 'Mumbai', duration: 9 }
    ];
    
    const operators = [
      { name: 'RedBus Travels', type: 'AC Sleeper', seats: 40, fare: 800 },
      { name: 'Orange Travels', type: 'AC Seater', seats: 50, fare: 400 },
      { name: 'SRS Travels', type: 'Volvo AC', seats: 45, fare: 700 },
      { name: 'VRL Travels', type: 'Non-AC Sleeper', seats: 35, fare: 300 },
      { name: 'Kallada Travels', type: 'Volvo Multi-Axle', seats: 42, fare: 900 }
    ];
    
    const timeSlots = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '23:00'];
    
    // Generate buses for 30 days
    for (let day = 0; day < 30; day++) {
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
              amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Reading Light'],
              bookedSeats: [],
              status: 'Active'
            });
          });
        });
      });
    }
    
    await Bus.insertMany(buses);
    console.log(`✅ Created ${buses.length} buses for 30 days`);
    
    // Verify data
    const userCount = await User.countDocuments();
    const couponCount = await Coupon.countDocuments();
    const busCount = await Bus.countDocuments();
    const todayBuses = await Bus.find({
      departure: {
        $gte: new Date('2026-01-31T00:00:00.000Z'),
        $lt: new Date('2026-01-31T23:59:59.999Z')
      }
    }).countDocuments();
    
    console.log('\n📊 PERMANENT DATA SUMMARY:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`🎫 Coupons: ${couponCount}`);
    console.log(`🚌 Total Buses: ${busCount}`);
    console.log(`📅 Buses for Jan 31, 2026: ${todayBuses}`);
    
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('Admin: admin@bookmyseat.com / admin123');
    console.log('Admin: dharsh@bookmyseat.com / dharsh123');
    console.log('User: user@demo.com / user123');
    
    console.log('\n🎟️ COUPON CODES:');
    console.log('SAVE20 - 20% off (min ₹500)');
    console.log('FLAT100 - ₹100 off (min ₹800)');
    console.log('FIRST50 - ₹50 off (min ₹300)');
    
    console.log('\n✅ ALL DATA SAVED PERMANENTLY TO DATABASE');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupPermanentData();