import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import authRoutes from './Routes/Authroute.js';
import busRoutes from './Routes/Busroute.js';
import couponRoutes from './Routes/Couponroute.js';
import contactRoutes from './Routes/Contactroute.js';

dotenv.config();

const app = express();

app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:5173'], 
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/contact', contactRoutes);

app.get('/', (req,res)=> res.json({ 
  status: 'success',
  message: 'BookMySeat API Server is running (Quick Start)'
}));

async function quickStart(){
  try{
    await connectDb();
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌐 Visit: http://localhost:${port}`);
    });
  }catch(err){
    console.error('Server start error:', err);
  }
}

quickStart();