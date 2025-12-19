import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true, index: true },
  seats: [String],
  busDetails: {
    name: String,
    from: String,
    to: String,
    operator: String,
    busNumber: String,
    departure: Date,
    arrival: Date,
    fare: Number
  },
  payment: {
    totalAmount: Number,
    discount: Number,
    finalAmount: Number,
    method: String,
    status: String
  },
  status: { type: String, default: 'Confirmed', index: true },
  holdExpiry: { type: Date, index: true },
  cancellation: {
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundPercentage: Number,
    refundStatus: { type: String, enum: ['Processing', 'Completed', 'No Refund'], default: 'Processing' },
    estimatedRefundDate: Date
  },
  tracking: {
    currentLocation: String,
    lastUpdated: Date,
    estimatedArrival: Date,
    status: { type: String, enum: ['Not Started', 'In Transit', 'Delayed', 'Arrived'], default: 'Not Started' }
  },
  notifications: [{
    message: String,
    time: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now, index: true }
});

// Compound indexes for common queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bus: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);
