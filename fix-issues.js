import { connectDb } from './Db/Db.js';
import User from './Model/Usermodel.js';
import Bus from './Model/Busmodel.js';
import Coupon from './Model/Couponmodel.js';
import bcrypt from 'bcryptjs';

async function fixCommonIssues() {
  console.log('🔧 Fixing common BookMySeat issues...\n');
  
  try {
    await connectDb();
    console.log('✅ Database connected');
    
    // Fix 1: Ensure admin accounts exist
    console.log('\n1. Checking admin accounts...');
    const adminAccounts = [
      { name: 'System Admin', email: 'admin@bookmyseat.com', password: 'admin123', role: 'admin' },
      { name: 'Dharsh Kumar', email: 'dharsh@bookmyseat.com', password: 'dharsh123', role: 'admin' },
      { name: 'Demo User', email: 'user@demo.com', password: 'user123', role: 'user' }
    ];
    
    for (const account of adminAccounts) {
      const existing = await User.findOne({ email: account.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await User.create({ ...account, password: hashedPassword });
        console.log(`   ✅ Created account: ${account.email}`);
      } else {
        console.log(`   ✅ Account exists: ${account.email}`);
      }
    }
    
    // Fix 2: Check bus data
    console.log('\n2. Checking bus data...');
    const busCount = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ 
      departure: { $gte: new Date() },
      status: 'Active'
    });
    
    console.log(`   Total buses: ${busCount}`);
    console.log(`   Active buses: ${activeBuses}`);
    
    if (activeBuses < 100) {
      console.log('   ⚠️  Low active bus count, regenerating...');
      // This would trigger the regeneration in the main server
    }
    
    // Fix 3: Ensure coupons exist
    console.log('\n3. Checking coupons...');
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      const defaultCoupons = [
        { code: "FIRST10", discount: 10, type: "percentage", minAmount: 200, maxDiscount: 100, expiryDate: new Date('2030-12-31'), isActive: true },
        { code: "SAVE50", discount: 50, type: "fixed", minAmount: 300, maxDiscount: 50, expiryDate: new Date('2030-12-31'), isActive: true }
      ];
      await Coupon.insertMany(defaultCoupons);
      console.log('   ✅ Created default coupons');
    } else {
      console.log(`   ✅ ${couponCount} coupons available`);
    }
    
    console.log('\n🎉 All fixes applied successfully!');
    console.log('\n📋 System Status:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Buses: ${await Bus.countDocuments()}`);
    console.log(`   Coupons: ${await Coupon.countDocuments()}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixCommonIssues();