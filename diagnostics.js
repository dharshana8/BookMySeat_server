import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import User from './Model/Usermodel.js';
import Bus from './Model/Busmodel.js';
import Coupon from './Model/Couponmodel.js';

dotenv.config();

async function runDiagnostics() {
  console.log('🔍 Running BookMySeat Diagnostics...\n');
  
  try {
    // Test 1: Environment Variables
    console.log('1. Environment Variables:');
    console.log('   MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
    console.log('   PORT:', process.env.PORT || '5000 (default)');
    console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    
    // Test 2: Database Connection
    console.log('\n2. Database Connection:');
    await connectDb();
    console.log('   ✅ MongoDB connected successfully');
    
    // Test 3: Collections Check
    console.log('\n3. Database Collections:');
    const userCount = await User.countDocuments();
    const busCount = await Bus.countDocuments();
    const couponCount = await Coupon.countDocuments();
    
    console.log(`   Users: ${userCount} documents`);
    console.log(`   Buses: ${busCount} documents`);
    console.log(`   Coupons: ${couponCount} documents`);
    
    // Test 4: Sample Data Check
    console.log('\n4. Sample Data:');
    if (userCount > 0) {
      const sampleUser = await User.findOne({}, 'name email role');
      console.log('   Sample User:', sampleUser);
    }
    
    if (busCount > 0) {
      const sampleBus = await Bus.findOne({}, 'name from to departure fare');
      console.log('   Sample Bus:', sampleBus);
    }
    
    // Test 5: Server Port Check
    console.log('\n5. Port Availability:');
    const app = express();
    const port = process.env.PORT || 5000;
    
    const server = app.listen(port, () => {
      console.log(`   ✅ Port ${port} is available`);
      server.close();
      
      console.log('\n🎉 All diagnostics passed! System should work properly.');
      process.exit(0);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`   ⚠️  Port ${port} is already in use`);
        console.log('   💡 Try stopping any running servers or use a different port');
      } else {
        console.log(`   ❌ Port error: ${err.message}`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check if MongoDB is running');
    console.error('   2. Verify .env file exists with correct MONGO_URI');
    console.error('   3. Run: npm install');
    console.error('   4. Check internet connection for MongoDB Atlas');
    process.exit(1);
  }
}

runDiagnostics();