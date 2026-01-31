import mongoose from 'mongoose';
import Bus from './Model/Busmodel.js';
import dotenv from 'dotenv';

dotenv.config();

async function forceUpdateDates() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus_tbooking');
    console.log('🔄 FORCE UPDATING ALL BUS DATES TO TODAY...');
    
    // Delete all existing buses and recreate with current dates
    await Bus.deleteMany({});
    console.log('✅ Cleared old buses');
    
    const buses = [];
    const today = new Date('2026-01-31'); // Force to January 31, 2026
    
    const routes = [
      { from: 'Mumbai', to: 'Pune', duration: 3.5 },
      { from: 'Delhi', to: 'Agra', duration: 4 },
      { from: 'Bangalore', to: 'Chennai', duration: 6 },
      { from: 'Chennai', to: 'Bangalore', duration: 6 },
      { from: 'Pune', to: 'Mumbai', duration: 3.5 }
    ];
    
    const operators = [
      { name: 'RedBus Travels', type: 'AC Sleeper', seats: 40, fare: 800 },
      { name: 'Orange Travels', type: 'AC Seater', seats: 50, fare: 400 },
      { name: 'SRS Travels', type: 'Volvo AC', seats: 45, fare: 700 }
    ];
    
    const timeSlots = ['06:00', '12:00', '18:00', '23:00'];
    
    // Generate buses for next 30 days starting TODAY
    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      
      routes.forEach(route => {
        operators.forEach(operator => {
          timeSlots.forEach(timeSlot => {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const departureDateTime = new Date(currentDate);
            departureDateTime.setHours(hours, minutes, 0, 0);
            
            const arrivalDateTime = new Date(departureDateTime.getTime() + (route.duration * 60 * 60 * 1000));
            
            buses.push({
              id: `BUS-${departureDateTime.getTime()}-${Math.random().toString(36).substr(2, 5)}`,
              name: `${operator.name} ${operator.type}`,
              from: route.from,
              to: route.to,
              departure: departureDateTime,
              arrival: arrivalDateTime,
              fare: operator.fare,
              totalSeats: operator.seats,
              availableSeats: operator.seats,
              type: operator.type,
              rating: 4.2,
              operator: operator.name,
              busNumber: `${operator.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
              amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
              bookedSeats: [],
              status: 'Active'
            });
          });
        });
      });
    }
    
    await Bus.insertMany(buses);
    console.log(`✅ Created ${buses.length} buses with TODAY'S DATE`);
    
    const sample = await Bus.find().sort({ departure: 1 }).limit(3);
    console.log('\nFirst 3 buses:');
    sample.forEach(bus => {
      console.log(`${bus.name}: ${bus.departure.toDateString()} ${bus.departure.toTimeString().slice(0,5)}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

forceUpdateDates();