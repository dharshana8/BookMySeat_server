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
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();

app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'https://bookmyseat.vercel.app', 'https://bustbooking.netlify.app'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/contact', contactRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

app.get('/', (req,res)=> res.json({ 
  status: 'success',
  message: 'BookMySeat API Server is running',
  timestamp: new Date().toISOString(),
  endpoints: {
    auth: '/api/auth',
    buses: '/api/buses', 
    coupons: '/api/coupons',
    contact: '/api/contact'
  }
}));

app.get('/health', (req,res)=> res.json({ status: 'healthy', uptime: process.uptime() }));

app.get('/seed-data', async (req, res) => {
  try {
    await ensurePermanentData();
    const busCount = await Bus.countDocuments();
    const userCount = await User.countDocuments();
    const couponCount = await Coupon.countDocuments();
    res.json({ 
      message: 'Data seeded successfully',
      buses: busCount,
      users: userCount,
      coupons: couponCount
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/debug/buses', async (req, res) => {
  try {
    const count = await Bus.countDocuments();
    const sample = await Bus.find().limit(3);
    return res.json({ count, sample });
  } catch (err) {
    return res.json({ error: err.message });
  }
});

app.post('/debug/reseed', async (req, res) => {
  try {
    await Bus.deleteMany({});
    const defaultBuses = generateDefaultBuses();
    await Bus.insertMany(defaultBuses);
    return res.json({ message: `Reseeded ${defaultBuses.length} buses` });
  } catch (err) {
    return res.json({ error: err.message });
  }
});





function generatePermanentBuses() {
  const buses = [];
  const today = new Date();
  
  const routes = [
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
  
  const operators = [
    { name: 'RedBus Travels', types: [{ type: 'AC Sleeper', seats: 40, fare: 800 }, { type: 'AC Semi Sleeper', seats: 45, fare: 600 }] },
    { name: 'Orange Travels', types: [{ type: 'AC Sleeper', seats: 38, fare: 750 }, { type: 'AC Seater', seats: 50, fare: 400 }] },
    { name: 'SRS Travels', types: [{ type: 'Volvo AC', seats: 45, fare: 700 }, { type: 'Non AC Seater', seats: 55, fare: 250 }] },
    { name: 'VRL Travels', types: [{ type: 'Multi Axle AC', seats: 40, fare: 850 }, { type: 'AC Semi Sleeper', seats: 42, fare: 550 }] }
  ];
  
  const timeSlots = ['06:00', '12:00', '18:00', '23:00'];
  
  // Generate buses for next 365 days
  for (let day = 0; day < 365; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    
    routes.forEach(route => {
      operators.forEach(operator => {
        operator.types.forEach(busType => {
          timeSlots.forEach(timeSlot => {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const departureDateTime = new Date(currentDate);
            departureDateTime.setHours(hours, minutes, 0, 0);
            
            const arrivalDateTime = new Date(departureDateTime.getTime() + (route.duration * 60 * 60 * 1000));
            
            buses.push({
              id: `BUS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: `${operator.name} ${busType.type}`,
              from: route.from,
              to: route.to,
              departure: departureDateTime,
              arrival: arrivalDateTime,
              fare: busType.fare + (route.distance * 0.5) + (timeSlot >= '21:00' ? 100 : 0),
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

async function ensurePermanentData(){
  try{
    console.log('🔍 Checking permanent data...');
    
    // Check if we have enough buses (should have thousands)
    const busCount = await Bus.countDocuments();
    const userCount = await User.countDocuments();
    const couponCount = await Coupon.countDocuments();
    
    console.log(`📊 Current counts - Buses: ${busCount}, Users: ${userCount}, Coupons: ${couponCount}`);
    
    // ALWAYS ensure we have complete data
    if (busCount < 50000 || userCount < 4 || couponCount < 4) {
      console.log('🚀 Creating permanent data...');
      // Create default users
      const users = [
        { name: 'System Admin', email: 'admin@bookmyseat.com', password: 'admin123', role: 'admin' },
        { name: 'Dharsh Kumar', email: 'dharsh@bookmyseat.com', password: 'dharsh123', role: 'admin' },
        { name: 'Harishini Admin', email: 'harishini@bookmyseat.com', password: 'harishini123', role: 'admin' },
        { name: 'Demo User', email: 'user@demo.com', password: 'user123', role: 'user' }
      ];
      
      for (const userData of users) {
        const existing = await User.findOne({ email: userData.email });
        if (!existing) {
          const hashed = await bcrypt.hash(userData.password, 10);
          await User.create({ ...userData, password: hashed });
        }
      }
      
      // Create permanent coupons
      if (couponCount < 3) {
        await Coupon.deleteMany({});
        const coupons = [
          { code: "FIRST10", discount: 10, type: "percentage", minAmount: 200, maxDiscount: 100, expiryDate: new Date('2030-12-31'), isActive: true },
          { code: "SAVE50", discount: 50, type: "fixed", minAmount: 300, maxDiscount: 50, expiryDate: new Date('2030-12-31'), isActive: true },
          { code: "WEEKEND20", discount: 20, type: "percentage", minAmount: 400, maxDiscount: 200, expiryDate: new Date('2030-12-31'), isActive: true },
          { code: "STUDENT15", discount: 15, type: "percentage", minAmount: 250, maxDiscount: 150, expiryDate: new Date('2030-12-31'), isActive: true }
        ];
        await Coupon.insertMany(coupons);
      }
      
      // ALWAYS ensure buses for full year
      if (busCount < 50000) {
        console.log('🛣️ Regenerating all buses...');
        await Bus.deleteMany({});
        const buses = generatePermanentBuses();
        console.log(`📊 Generated ${buses.length} buses`);
        
        // Insert in batches
        const batchSize = 1000;
        for (let i = 0; i < buses.length; i += batchSize) {
          const batch = buses.slice(i, i + batchSize);
          await Bus.insertMany(batch);
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(buses.length/batchSize)}`);
        }
        console.log('🎉 All buses created!');
      }
    }
  }catch(err){
    console.error('Error ensuring permanent data:', err);
  }
}

async function start(){
  try{
    await connectDb();
    await ensurePermanentData();
    
    const port = process.env.PORT || 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌐 Visit: http://localhost:${port}`);
      console.log(`📡 App is listening on port ${port}`);
    });
    
  }catch(err){
    console.error('Server start error:', err);
    setTimeout(start, 3000);
  }
}

start();