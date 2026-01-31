import mongoose from 'mongoose';
import Bus from './Model/Busmodel.js';
import User from './Model/Usermodel.js';
import Coupon from './Model/Couponmodel.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSystem() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus_tbooking');
    console.log('🔍 TESTING SYSTEM...\n');
    
    // Test 1: Check Users
    const users = await User.find();
    console.log(`👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    // Test 2: Check Coupons
    const coupons = await Coupon.find({ isActive: true });
    console.log(`\n🎫 Active Coupons: ${coupons.length}`);
    coupons.forEach(coupon => {
      console.log(`   - ${coupon.code}: ${coupon.type === 'percentage' ? coupon.discount + '%' : '₹' + coupon.discount} off`);
    });
    
    // Test 3: Check Buses
    const totalBuses = await Bus.countDocuments();
    console.log(`\n🚌 Total Buses: ${totalBuses}`);
    
    // Test 4: Check buses for today (Jan 31, 2026)
    const today = new Date('2026-01-31');
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayBuses = await Bus.find({
      departure: { $gte: todayStart, $lte: todayEnd }
    });
    console.log(`📅 Buses for Jan 31, 2026: ${todayBuses.length}`);
    
    if (todayBuses.length > 0) {
      console.log('   Sample buses:');
      todayBuses.slice(0, 3).forEach(bus => {
        console.log(`   - ${bus.name}: ${bus.from} → ${bus.to} at ${new Date(bus.departure).toTimeString().slice(0,5)}`);
      });
    }
    
    // Test 5: Check different routes
    const routes = await Bus.aggregate([
      { $group: { _id: { from: '$from', to: '$to' }, count: { $sum: 1 } } },
      { $limit: 5 }
    ]);
    console.log(`\n🛣️ Available Routes: ${routes.length}`);
    routes.forEach(route => {
      console.log(`   - ${route._id.from} → ${route._id.to}: ${route.count} buses`);
    });
    
    // Test 6: Search functionality test
    const searchResult = await Bus.find({
      from: new RegExp('Mumbai', 'i'),
      to: new RegExp('Pune', 'i'),
      departure: { $gte: todayStart, $lte: todayEnd }
    });
    console.log(`\n🔍 Search Test (Mumbai → Pune on Jan 31): ${searchResult.length} buses found`);
    
    console.log('\n✅ SYSTEM TEST COMPLETE');
    console.log('\n🌐 Ready to test at: http://localhost:3000');
    console.log('👤 Test accounts:');
    console.log('   - admin@bookmyseat.com / admin123');
    console.log('   - user@demo.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test Error:', error);
    process.exit(1);
  }
}

testSystem();