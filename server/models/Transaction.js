import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    transactionType: { type: String, enum: ['Material', 'Labour Attendance', 'Labour Payment', 'Client Payment', 'Other Expense'], required: true },
    description: { type: String, required: true },
    moneyIn: { type: Number, default: 0 },
    moneyOut: { type: Number, default: 0 },
    paymentMode: String,
    notes: String,
    sourceModel: { type: String, required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true }
  },
  { timestamps: true }
);

transactionSchema.index({ sourceModel: 1, sourceId: 1 }, { unique: true });

export default mongoose.model('Transaction', transactionSchema);
