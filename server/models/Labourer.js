import mongoose from 'mongoose';

const labourerSchema = new mongoose.Schema(
  {
    labourName: { type: String, required: true, trim: true },
    phone: String,
    skillType: { type: String, enum: ['Mason', 'Helper', 'Painter', 'Carpenter', 'Electrician', 'Plumber', 'Supervisor', 'Other'], required: true },
    dailyWage: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    deactivatedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Labourer', labourerSchema);
