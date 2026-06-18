import mongoose from 'mongoose';

const clientPaymentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    clientNameSnapshot: String,
    date: { type: Date, required: true },
    amountReceived: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'], required: true },
    referenceNumber: String,
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model('ClientPayment', clientPaymentSchema);
