import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import User from './Model/Usermodel.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function createTestAccounts() {
  try {
    await connectDb();
    
    console.log('Creating test accounts...');
    
    // Note: Not clearing existing users to preserve registered accounts
    
    // Create admin accounts
    const adminAccounts = [
      { name: 'Admin User', email: 'admin@bookmyseat.com', password: 'admin123' },
      { name: 'Test Admin', email: 'test@bookmyseat.com', password: 'test123' },
      { name: 'Dharsh Admin', email: 'dharsh@bookmyseat.com', password: 'dharsh123' },
      { name: 'Harishini', email: 'harishini@bookmyseat.com', password: 'harishini123' }
    ];
    
    // Create regular user accounts
    const userAccounts = [
      { name: 'John Doe', email: 'john@example.com', password: 'john123' },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'jane123' },
      { name: 'Dharshana Sivakumar', email: 'dharshanasivakumar8@gmail.com', password: 'dharsh123' }
    ];
    
    // Create admin accounts
    for (const account of adminAccounts) {
      const existingUser = await User.findOne({ email: account.email });
      if (existingUser) {
        console.log(`⏭️  Admin already exists: ${account.email}`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(account.password, 10);
      await User.create({
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: 'admin'
      });
      console.log(`✅ Admin created: ${account.email} / ${account.password}`);
    }
    
    // Create user accounts
    for (const account of userAccounts) {
      const existingUser = await User.findOne({ email: account.email });
      if (existingUser) {
        console.log(`⏭️  User already exists: ${account.email}`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(account.password, 10);
      await User.create({
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: 'user'
      });
      console.log(`✅ User created: ${account.email} / ${account.password}`);
    }
    
    console.log('\n🎉 All test accounts created successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('='.repeat(50));
    console.log('ADMIN ACCOUNTS:');
    adminAccounts.forEach(acc => console.log(`  ${acc.email} / ${acc.password}`));
    console.log('\nUSER ACCOUNTS:');
    userAccounts.forEach(acc => console.log(`  ${acc.email} / ${acc.password}`));
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating accounts:', err);
    process.exit(1);
  }
}

createTestAccounts();