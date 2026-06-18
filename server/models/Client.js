import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, required: true },
    notes: String,
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    deactivatedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Client', clientSchema);
