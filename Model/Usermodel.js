import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

// Auto-assign admin role to @bookmyseat.com emails
userSchema.pre('save', function(next) {
  if (this.email && this.email.endsWith('@bookmyseat.com')) {
    this.role = 'admin';
  }
  next();
});

export default mongoose.model('User', userSchema);
