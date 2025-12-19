import mongoose from 'mongoose';

const checkpointSchema = new mongoose.Schema({ name: String, time: String, type: String });

const busSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, index: true },
  from: { type: String, index: true },
  to: { type: String, index: true },
  departure: { type: Date, index: true },
  arrival: Date,
  fare: { type: Number, index: true },
  totalSeats: Number,
  availableSeats: Number,
  type: { type: String, index: true },
  rating: Number,
  amenities: [String],
  operator: String,
  busNumber: String,
  seatLayout: String,
  imageUrl: String,
  description: String,
  bookedSeats: [String],
  heldSeats: [{
    seat: String,
    userId: mongoose.Schema.Types.ObjectId,
    expiresAt: Date
  }],
  checkpoints: [checkpointSchema],
  status: String,
  delayInfo: {
    isDelayed: { type: Boolean, default: false },
    delayMinutes: { type: Number, default: 0 },
    reason: String,
    updatedAt: Date
  }
}, { timestamps: true });

// Compound indexes for common search queries
busSchema.index({ from: 1, to: 1, departure: 1 });
busSchema.index({ type: 1, fare: 1 });
busSchema.index({ departure: 1, availableSeats: 1 });

export default mongoose.model('Bus', busSchema);
