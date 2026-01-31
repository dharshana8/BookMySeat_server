import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';
import User from './Model/Usermodel.js';
import Booking from './Model/Bookingmodel.js';
import Coupon from './Model/Couponmodel.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function completeSystemSetup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear everything
    await Bus.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});
    await Coupon.deleteMany({});
    console.log('✅ Cleared all existing data');

    // Create admin and user accounts
    const users = [
      { name: 'System Admin', email: 'admin@bookmyseat.com', password: 'admin123', role: 'admin' },
      { name: 'Dharsh Kumar', email: 'dharsh@bookmyseat.com', password: 'dharsh123', role: 'admin' },
      { name: 'Harishini Admin', email: 'harishini@bookmyseat.com', password: 'harishini123', role: 'admin' },
      { name: 'Demo User', email: 'user@demo.com', password: 'user123', role: 'user' },
      { name: 'Test User', email: 'test@demo.com', password: 'test123', role: 'user' }
    ];

    for (const userData of users) {
      const hashed = await bcrypt.hash(userData.password, 10);
      await User.create({ ...userData, password: hashed });
    }
    console.log('✅ Created user accounts');

    // Create coupons
    const coupons = [
      { code: "FIRST10", discount: 10, type: "percentage", minAmount: 200, maxDiscount: 100, expiryDate: new Date('2030-12-31'), isActive: true },
      { code: "SAVE50", discount: 50, type: "fixed", minAmount: 300, maxDiscount: 50, expiryDate: new Date('2030-12-31'), isActive: true },
      { code: "WEEKEND20", discount: 20, type: "percentage", minAmount: 400, maxDiscount: 200, expiryDate: new Date('2030-12-31'), isActive: true },
      { code: "STUDENT15", discount: 15, type: "percentage", minAmount: 250, maxDiscount: 150, expiryDate: new Date('2030-12-31'), isActive: true }
    ];
    await Coupon.insertMany(coupons);
    console.log('✅ Created coupons');

    // Create comprehensive bus data
    const routes = [
      { from: 'Mumbai', to: 'Pune', distance: 150, baseFare: 500 },
      { from: 'Delhi', to: 'Agra', distance: 230, baseFare: 400 },
      { from: 'Bangalore', to: 'Chennai', distance: 350, baseFare: 600 },
      { from: 'Hyderabad', to: 'Vijayawada', distance: 275, baseFare: 350 },
      { from: 'Kolkata', to: 'Bhubaneswar', distance: 440, baseFare: 450 },
      { from: 'Ahmedabad', to: 'Surat', distance: 265, baseFare: 300 },
      { from: 'Jaipur', to: 'Udaipur', distance: 400, baseFare: 550 },
      { from: 'Kochi', to: 'Trivandrum', distance: 200, baseFare: 400 },
      { from: 'Chennai', to: 'Bangalore', distance: 350, baseFare: 600 },
      { from: 'Pune', to: 'Mumbai', distance: 150, baseFare: 500 }
    ];

    const operators = [
      { name: 'RedBus Express', rating: 4.5 },
      { name: 'Orange Travels', rating: 4.2 },
      { name: 'SRS Travels', rating: 4.3 },
      { name: 'VRL Travels', rating: 4.4 },
      { name: 'BookMySeat Express', rating: 4.6 }
    ];

    const busTypes = [
      { type: 'AC Sleeper', seats: 40, fareMultiplier: 1.5 },
      { type: 'AC Semi Sleeper', seats: 45, fareMultiplier: 1.2 },
      { type: 'AC Seater', seats: 50, fareMultiplier: 1.0 },
      { type: 'Non AC Seater', seats: 55, fareMultiplier: 0.7 }
    ];

    const timeSlots = [
      { time: '06:00', label: 'Morning' },
      { time: '10:00', label: 'Morning' },
      { time: '14:00', label: 'Afternoon' },
      { time: '18:00', label: 'Evening' },
      { time: '22:00', label: 'Night' },
      { time: '23:30', label: 'Night' }
    ];

    const buses = [];
    const today = new Date();
    
    // Generate buses for next 30 days
    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      
      routes.forEach(route => {
        operators.forEach(operator => {
          busTypes.forEach(busType => {
            timeSlots.forEach(slot => {
              const [hours, minutes] = slot.time.split(':').map(Number);
              const departure = new Date(currentDate);
              departure.setHours(hours, minutes, 0, 0);
              
              // Calculate journey duration based on distance
              const durationHours = Math.ceil(route.distance / 60); // 60 km/hr average
              const arrival = new Date(departure.getTime() + durationHours * 60 * 60 * 1000);
              
              const fare = Math.round(route.baseFare * busType.fareMultiplier);
              
              buses.push({
                id: `BUS-${departure.getTime()}-${Math.random().toString(36).substr(2, 5)}`,
                name: `${operator.name} ${busType.type}`,
                from: route.from,
                to: route.to,
                departure,
                arrival,
                fare,
                totalSeats: busType.seats,
                availableSeats: busType.seats,
                bookedSeats: [],
                heldSeats: [],
                type: busType.type,
                rating: operator.rating,
                operator: operator.name,
                busNumber: `${operator.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
                status: 'On Time',
                amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Reading Light'],
                imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
                description: `Comfortable ${busType.type} service from ${route.from} to ${route.to}`,
                checkpoints: [
                  { name: route.from, time: slot.time, type: 'start' },
                  { name: route.to, time: arrival.toTimeString().slice(0, 5), type: 'end' }
                ]
              });
            });
          });
        });
      });
    }

    // Insert buses in batches
    const batchSize = 100;
    for (let i = 0; i < buses.length; i += batchSize) {
      const batch = buses.slice(i, i + batchSize);
      await Bus.insertMany(batch);
    }

    console.log(`✅ Created ${buses.length} buses for 30 days`);
    console.log(`✅ Routes: ${routes.length}`);
    console.log(`✅ Operators: ${operators.length}`);
    console.log(`✅ Bus types: ${busTypes.length}`);
    
    console.log('\n🎉 COMPLETE SYSTEM READY FOR REVIEW!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length} (3 admins, 2 users)`);
    console.log(`   Buses: ${buses.length}`);
    console.log(`   Routes: ${routes.length}`);
    console.log(`   Coupons: ${coupons.length}`);
    console.log(`   Days covered: 30`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

completeSystemSetup();