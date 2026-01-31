import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import Bus from './Model/Busmodel.js';

dotenv.config();

async function verifyBusSchedule() {
  try {
    await connectDb();
    console.log('🔍 Verifying bus schedule...\n');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Get today's buses
    const todayBuses = await Bus.find({
      departure: { $gte: today, $lt: tomorrow }
    }).sort({ departure: 1 });
    
    console.log(`📅 Today's Date: ${today.toDateString()}`);
    console.log(`🚌 Total buses today: ${todayBuses.length}\n`);
    
    // Group by route
    const routeGroups = {};
    todayBuses.forEach(bus => {
      const routeKey = `${bus.from} → ${bus.to}`;
      if (!routeGroups[routeKey]) routeGroups[routeKey] = [];
      routeGroups[routeKey].push(bus);
    });
    
    // Show detailed schedule for each route
    Object.entries(routeGroups).forEach(([route, buses]) => {
      console.log(`🛣️  ${route} (${buses.length} buses):`);
      console.log('─'.repeat(60));
      
      buses.forEach((bus, index) => {
        const time = bus.departure.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${time} | ${bus.name} | ₹${bus.fare} | ${bus.totalSeats} seats`);
      });
      console.log('');
    });
    
    // Show timing distribution
    const timeDistribution = {};
    todayBuses.forEach(bus => {
      const hour = bus.departure.getHours();
      const period = hour < 6 ? 'Night (12-6 AM)' :
                    hour < 12 ? 'Morning (6-12 PM)' :
                    hour < 18 ? 'Afternoon (12-6 PM)' :
                    'Evening (6-12 AM)';
      
      if (!timeDistribution[period]) timeDistribution[period] = 0;
      timeDistribution[period]++;
    });
    
    console.log('⏰ Time Distribution:');
    console.log('─'.repeat(30));
    Object.entries(timeDistribution).forEach(([period, count]) => {
      console.log(`${period}: ${count} buses`);
    });
    
    // Check for daily services
    console.log('\n🔄 Daily Services Status:');
    console.log('─'.repeat(30));
    
    const dailyServiceBuses = todayBuses.filter(bus => 
      (bus.operator === 'RedBus Travels' && bus.type === 'AC Sleeper' && bus.departure.getHours() === 6) ||
      (bus.operator === 'Orange Travels' && bus.type === 'AC Sleeper' && bus.departure.getHours() === 17) ||
      (bus.operator === 'SRS Travels' && bus.type === 'Volvo AC' && bus.departure.getHours() === 20)
    );
    
    console.log(`Found ${dailyServiceBuses.length} daily service buses today`);
    dailyServiceBuses.forEach(bus => {
      console.log(`✅ ${bus.operator} ${bus.type} - ${bus.from} → ${bus.to} at ${bus.departure.toLocaleTimeString()}`);
    });
    
    console.log('\n✅ Bus schedule verification completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyBusSchedule();