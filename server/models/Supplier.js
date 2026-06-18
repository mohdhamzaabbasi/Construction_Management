import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    materialCategory: { type: String, required: true },
    notes: String,
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    deactivatedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Supplier', supplierSchema);
