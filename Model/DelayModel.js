import mongoose from 'mongoose';

const delaySchema = new mongoose.Schema({
  busId: { type: String, required: true },
  delayMinutes: { type: Number, required: true },
  reason: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalDeparture: { type: Date, required: true },
  originalArrival: { type: Date, required: true },
  newDeparture: { type: Date, required: true },
  newArrival: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Delay', delaySchema);