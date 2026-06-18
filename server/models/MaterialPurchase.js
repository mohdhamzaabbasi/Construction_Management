import mongoose from 'mongoose';

const materialPurchaseSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    date: { type: Date, required: true },
    materialName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['bags', 'kg', 'tons', 'pieces', 'cubic feet', 'brass', 'loads'], required: true },
    ratePerUnit: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, default: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierNameSnapshot: String,
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'], required: true },
    paidAmount: { type: Number, default: 0, min: 0 },
    pendingAmount: { type: Number, default: 0 },
    billInvoiceNumber: String,
    notes: String
  },
  { timestamps: true }
);

materialPurchaseSchema.pre('save', function calculate(next) {
  this.totalAmount = Number(this.quantity || 0) * Number(this.ratePerUnit || 0);
  this.pendingAmount = Math.max(this.totalAmount - Number(this.paidAmount || 0), 0);
  next();
});

export default mongoose.model('MaterialPurchase', materialPurchaseSchema);
