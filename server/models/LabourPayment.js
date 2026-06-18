import mongoose from 'mongoose';

const labourPaymentSchema = new mongoose.Schema(
  {
    attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourAttendance', required: true, unique: true },
    attendanceDate: { type: Date, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    labourer: { type: mongoose.Schema.Types.ObjectId, ref: 'Labourer', required: true },
    labourNameSnapshot: String,
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit', ''], default: '' },
    paymentDate: Date,
    status: { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model('LabourPayment', labourPaymentSchema);
