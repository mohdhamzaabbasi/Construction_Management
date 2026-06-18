import mongoose from 'mongoose';

const otherExpenseSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    date: { type: Date, required: true },
    expenseCategory: { type: String, enum: ['Transport', 'Food', 'Equipment Rent', 'Machine', 'Fuel', 'Contractor', 'Permit', 'Miscellaneous'], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'], required: true },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model('OtherExpense', otherExpenseSchema);
