import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    materialName: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: {
      type: String,
      enum: ['bags', 'kg', 'tons', 'pieces', 'cubic feet', 'brass', 'loads'],
      required: true
    },
    defaultRate: { type: Number, required: true, min: 0 },
    preferredSupplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    notes: String,
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    deactivatedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Material', materialSchema);
