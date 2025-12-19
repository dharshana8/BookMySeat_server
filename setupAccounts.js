import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import User from './Model/Usermodel.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const DEFAULT_ACCOUNTS = [
  // Admin accounts
  { name: 'Admin User', email: 'admin@bookmyseat.com', password: 'admin123', role: 'admin' },
  { name: 'Dharsh Admin', email: 'dharsh@bookmyseat.com', password: 'dharsh123', role: 'admin' },
  { name: 'Harishini Admin', email: 'harishini@bookmyseat.com', password: 'harishini123', role: 'admin' },
  
  // User accounts
  { name: 'Demo User', email: 'user@demo.com', password: 'user123', role: 'user' },
  { name: 'Test User', email: 'test@demo.com', password: 'test123', role: 'user' }
];

async function setupAccounts() {
  try {
    await connectDb();
    console.log('🔧 Setting up default accounts...\n');
    
    for (const account of DEFAULT_ACCOUNTS) {
      const existing = await User.findOne({ email: account.email });
      
      if (existing) {
        console.log(`✅ ${account.role.toUpperCase()}: ${account.email} (exists)`);
      } else {
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await User.create({
          name: account.name,
          email: account.email,
          password: hashedPassword,
          role: account.role
        });
        console.log(`🆕 ${account.role.toUpperCase()}: ${account.email} (created)`);
      }
    }
    
    console.log('\n🎉 Account setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  }
}

setupAccounts();