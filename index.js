import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import authRoutes from './Routes/Authroute.js';
import busRoutes from './Routes/Busroute.js';
import couponRoutes from './Routes/Couponroute.js';
import contactRoutes from './Routes/Contactroute.js';
import User from './Model/Usermodel.js';
import Bus from './Model/Busmodel.js';
import Coupon from './Model/Couponmodel.js';
import Booking from './Model/Bookingmodel.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();

app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/contact', contactRoutes);

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Server error', message: err.message });
});

app.get('/', (req,res)=> res.json({ 
  status: 'success',
  message: 'BookMySeat API Server - All Data Preserved',
  timestamp: new Date().toISOString()
}));

function generateBuses() {
  const buses = [];
  const now = new Date();
  
  const routes = [
    { from: 'Mumbai', to: 'Pune', distance: 150, duration: 3.5 },
    { from: 'Delhi', to: 'Agra', distance: 230, duration: 4 },
    { from: 'Bangalore', to: 'Chennai', distance: 350, duration: 6 },
    { from: 'Hyderabad', to: 'Vijayawada', distance: 275, duration: 5 },
    { from: 'Chennai', to: 'Bangalore', distance: 350, duration: 6 },
    { from: 'Pune', to: 'Mumbai', distance: 150, duration: 3.5 }
  ];
  
  const operators = [
    { name: 'RedBus Travels', types: [{ type: 'AC Sleeper', seats: 40, fare: 800 }] },
    { name: 'Orange Travels', types: [{ type: 'AC Seater', seats: 50, fare: 400 }] },
    { name: 'SRS Travels', types: [{ type: 'Volvo AC', seats: 45, fare: 700 }] }
  ];
  
  const timeSlots = ['06:00', '12:00', '18:00', '23:00'];
  
  // Generate buses for TODAY and next 364 days (365 total)
  for (let day = 0; day < 365; day++) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + day);
    
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
              fare: busType.fare,
              totalSeats: busType.seats,
              availableSeats: busType.seats,
              type: busType.type,
              rating: 4.2,
              operator: operator.name,
              busNumber: `${operator.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
              amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
              bookedSeats: [],
              status: 'Active'
            });
          });
        });
      });
    });
  }
  
  return buses;
}

async function preserveAndSetupData(){
  try{
    const busCount = await Bus.countDocuments();
    const userCount = await User.countDocuments();
    const couponCount = await Coupon.countDocuments();
    const bookingCount = await Booking.countDocuments();
    
    console.log(`📊 Existing data: ${busCount} buses, ${userCount} users, ${couponCount} coupons, ${bookingCount} bookings`);
    
    // Always ensure core users exist (don't delete existing ones)
    const coreUsers = [
      { name: 'System Admin', email: 'admin@bookmyseat.com', password: 'admin123', role: 'admin' },
      { name: 'Dharsh Kumar', email: 'dharsh@bookmyseat.com', password: 'dharsh123', role: 'admin' },
      { name: 'Demo User', email: 'user@demo.com', password: 'user123', role: 'user' }
    ];
    
    for (const userData of coreUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const hashed = await bcrypt.hash(userData.password, 10);
        await User.create({ ...userData, password: hashed });
        console.log(`✅ Created user: ${userData.email}`);
      }
    }
    
    // Always ensure coupons exist (don't delete existing ones)
    if (couponCount === 0) {
      const coupons = [
        { code: "FIRST10", discount: 10, type: "percentage", minAmount: 200, maxDiscount: 100, expiryDate: new Date('2030-12-31'), isActive: true },
        { code: "SAVE50", discount: 50, type: "fixed", minAmount: 300, maxDiscount: 50, expiryDate: new Date('2030-12-31'), isActive: true },
        { code: "WEEKEND20", discount: 20, type: "percentage", minAmount: 400, maxDiscount: 200, expiryDate: new Date('2030-12-31'), isActive: true },
        { code: "STUDENT15", discount: 15, type: "percentage", minAmount: 250, maxDiscount: 150, expiryDate: new Date('2030-12-31'), isActive: true }
      ];
      await Coupon.insertMany(coupons);
      console.log('✅ Created coupons');
    }
    
    // Only add buses if none exist (preserve existing buses)
    if (busCount === 0) {
      console.log('🚌 Creating bus data...');
      const buses = generateBuses();
      await Bus.insertMany(buses);
      console.log(`✅ Created ${buses.length} buses`);
    }
    
    console.log('💾 ALL EXISTING DATA PRESERVED!');
  }catch(err){
    console.error('Setup error:', err);
  }
}

async function start(){
  try{
    await connectDb();
    await preserveAndSetupData();
    
    const port = process.env.PORT || 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📧 Email system active`);
      console.log(`💾 All existing data preserved`);
    });
    
  }catch(err){
    console.error('Server start error:', err);
    setTimeout(start, 3000);
  }
}

start();