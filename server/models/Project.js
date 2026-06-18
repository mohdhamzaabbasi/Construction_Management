import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    clientNameSnapshot: String,
    siteLocation: { type: String, required: true },
    startDate: { type: Date, required: true },
    expectedEndDate: Date,
    status: { type: String, enum: ['Active', 'Completed', 'On Hold'], default: 'Active' },
    estimatedBudget: { type: Number, default: 0 },
    agreedContractAmount: { type: Number, required: true, default: 0 },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
