import mongoose from 'mongoose';
import Bus from './Model/Busmodel.js';
import User from './Model/Usermodel.js';
import Coupon from './Model/Couponmodel.js';
import dotenv from 'dotenv';

dotenv.config();

async function finalCheck() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected');
    
    const users = await User.countDocuments();
    const coupons = await Coupon.countDocuments({ isActive: true });
    const buses = await Bus.countDocuments();
    const todayBuses = await Bus.countDocuments({
      departure: {
        $gte: new Date('2026-01-31T00:00:00.000Z'),
        $lt: new Date('2026-01-31T23:59:59.999Z')
      }
    });
    
    console.log(`👥 Users: ${users}`);
    console.log(`🎫 Coupons: ${coupons}`);
    console.log(`🚌 Total Buses: ${buses}`);
    console.log(`📅 Jan 31 Buses: ${todayBuses}`);
    
    if (users >= 3 && coupons >= 3 && todayBuses >= 50) {
      console.log('\n✅ SYSTEM READY FOR PRODUCTION!');
    } else {
      console.log('\n❌ System not ready - missing data');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

finalCheck();