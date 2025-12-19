import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDb } from './Db/Db.js';
import Bus from './Model/Busmodel.js';

dotenv.config();

function generateBusesForYear() {
  const buses = [];
  const today = new Date();
  
  const routes = [
    { from: 'Mumbai', to: 'Pune', distance: 150, duration: 3.5 },
    { from: 'Delhi', to: 'Agra', distance: 230, duration: 4 },
    { from: 'Bangalore', to: 'Chennai', distance: 350, duration: 6 },
    { from: 'Hyderabad', to: 'Vijayawada', distance: 275, duration: 5 },
    { from: 'Kolkata', to: 'Bhubaneswar', distance: 440, duration: 7 },
    { from: 'Ahmedabad', to: 'Surat', distance: 265, duration: 4.5 },
    { from: 'Jaipur', to: 'Udaipur', distance: 400, duration: 6.5 },
    { from: 'Kochi', to: 'Trivandrum', distance: 200, duration: 4 },
    { from: 'Chennai', to: 'Bangalore', distance: 350, duration: 6 },
    { from: 'Pune', to: 'Mumbai', distance: 150, duration: 3.5 },
    { from: 'Mumbai', to: 'Goa', distance: 600, duration: 10 },
    { from: 'Delhi', to: 'Jaipur', distance: 280, duration: 5 }
  ];
  
  const operators = [
    { name: 'RedBus Travels', types: [{ type: 'AC Sleeper', seats: 40, fare: 800 }] },
    { name: 'Orange Travels', types: [{ type: 'AC Semi Sleeper', seats: 45, fare: 600 }] },
    { name: 'SRS Travels', types: [{ type: 'Volvo AC', seats: 45, fare: 700 }] },
    { name: 'VRL Travels', types: [{ type: 'Multi Axle AC', seats: 40, fare: 850 }] }
  ];
  
  const timeSlots = ['06:00', '12:00', '18:00', '23:00'];
  
  // Generate buses for next 365 days
  for (let day = 0; day < 365; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    
    routes.forEach(route => {
      timeSlots.forEach(timeSlot => {
        operators.forEach(operator => {
          operator.types.forEach(busType => {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const departureDateTime = new Date(currentDate);
            departureDateTime.setHours(hours, minutes, 0, 0);
            
            const arrivalDateTime = new Date(departureDateTime.getTime() + (route.duration * 60 * 60 * 1000));
            
            buses.push({
              id: `BUS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: `${operator.name} ${busType.type}`,
              from: route.from,
              to: route.to,
              departure: departureDateTime,
              arrival: arrivalDateTime,
              fare: busType.fare + (route.distance * 0.5) + (timeSlot >= '21:00' ? 100 : 0),
              totalSeats: busType.seats,
              availableSeats: busType.seats,
              type: busType.type,
              rating: 4.0 + Math.random() * 0.5,
              operator: operator.name,
              busNumber: `${operator.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
              seatLayout: busType.seats > 45 ? '2+3' : busType.seats > 40 ? '2+2' : '2+1',
              amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
              imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
              description: `Comfortable ${busType.type} service from ${route.from} to ${route.to}`,
              bookedSeats: [],
              heldSeats: [],
              status: 'Active',
              checkpoints: [
                { name: route.from, time: timeSlot, type: 'start' },
                { name: route.to, time: arrivalDateTime.toTimeString().slice(0, 5), type: 'end' }
              ]
            });
          });
        });
      });
    });
  }
  
  return buses;
}

async function regenerateBuses() {
  try {
    await connectDb();
    console.log('🔄 Regenerating buses for 365 days...');
    
    // Clear existing buses
    await Bus.deleteMany({});
    console.log('✅ Cleared existing buses');
    
    // Generate new buses
    const buses = generateBusesForYear();
    console.log(`📊 Generated ${buses.length} buses`);
    
    // Insert in batches
    const batchSize = 1000;
    for (let i = 0; i < buses.length; i += batchSize) {
      const batch = buses.slice(i, i + batchSize);
      await Bus.insertMany(batch);
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(buses.length/batchSize)}`);
    }
    
    console.log('🎉 Bus regeneration complete!');
    console.log(`📈 Total buses: ${buses.length}`);
    console.log('⏰ Time slots: 06:00, 12:00, 18:00, 23:00');
    console.log('📅 Coverage: 365 days from today');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

regenerateBuses();