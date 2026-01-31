import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function testRealTimeFiltering() {
  try {
    await mongoose.connect('mongodb://localhost:27017/bus_tbooking');
    console.log('🧪 Testing real-time bus filtering...');
    
    const now = new Date();
    console.log(`⏰ Current system time: ${now.toLocaleString()}`);
    
    // Test 1: Get all buses for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const allTodayBuses = await Bus.find({
      departure: { $gte: today, $lte: endOfDay }
    }).sort({ departure: 1 });
    
    console.log(`\n📊 Total buses scheduled for today: ${allTodayBuses.length}`);
    
    // Test 2: Get only future buses (not departed)
    const futureBuses = await Bus.find({
      departure: { $gte: now, $lte: endOfDay }
    }).sort({ departure: 1 });
    
    console.log(`✅ Buses still available for booking today: ${futureBuses.length}`);
    console.log(`❌ Buses that have already departed: ${allTodayBuses.length - futureBuses.length}`);
    
    // Test 3: Show next 10 available buses
    console.log(`\n🚌 Next 10 buses available for booking:`);
    const nextBuses = futureBuses.slice(0, 10);
    nextBuses.forEach((bus, index) => {
      const timeUntilDeparture = Math.round((new Date(bus.departure) - now) / (1000 * 60));
      console.log(`${index + 1}. ${bus.departure.toLocaleTimeString()} (in ${timeUntilDeparture} min) - ${bus.from} → ${bus.to} - ${bus.operator}`);
    });
    
    // Test 4: Check Mumbai to Pune route specifically
    const mumbaiPuneBuses = futureBuses.filter(b => b.from === 'Mumbai' && b.to === 'Pune');
    console.log(`\n🎯 Mumbai → Pune buses remaining today: ${mumbaiPuneBuses.length}`);
    
    // Test 5: Show tomorrow's buses
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    const tomorrowBuses = await Bus.find({
      departure: { $gte: tomorrow, $lte: endOfTomorrow }
    }).sort({ departure: 1 });
    
    console.log(`\n📅 Tomorrow (${tomorrow.toDateString()}) buses available: ${tomorrowBuses.length}`);
    
    console.log('\n✅ Real-time filtering test completed!');
    console.log('🔄 The system will automatically filter out departed buses');
    console.log('📱 Users can only book future buses');\n    \n    process.exit(0);\n  } catch (err) {\n    console.error('❌ Error:', err);\n    process.exit(1);\n  }\n}\n\ntestRealTimeFiltering();