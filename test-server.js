import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';

dotenv.config();

async function testServerStart() {
  try {
    console.log('🧪 Testing server startup...');
    
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    await connectDb();
    console.log('✅ Database connected');
    
    app.get('/', (req, res) => {
      res.json({ 
        status: 'success',
        message: 'BookMySeat API Server is running',
        timestamp: new Date().toISOString()
      });
    });
    
    const port = process.env.PORT || 5000;
    const server = app.listen(port, () => {
      console.log(`✅ Server started successfully on port ${port}`);
      console.log(`🌐 Test URL: http://localhost:${port}`);
      
      // Test the endpoint
      fetch(`http://localhost:${port}`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Server response:', data.message);
          console.log('🎉 Server test completed successfully!');
          server.close();
          process.exit(0);
        })
        .catch(err => {
          console.error('❌ Server test failed:', err.message);
          server.close();
          process.exit(1);
        });
    });
    
    server.on('error', (err) => {
      console.error('❌ Server startup failed:', err.message);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testServerStart();