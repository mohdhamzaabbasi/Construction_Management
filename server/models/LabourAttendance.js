import mongoose from 'mongoose';

const labourAttendanceSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    date: { type: Date, required: true },
    labourer: { type: mongoose.Schema.Types.ObjectId, ref: 'Labourer', required: true },
    labourNameSnapshot: String,
    attendance: { type: String, enum: ['Full Day', 'Half Day', 'Absent'], required: true },
    overtimeHours: { type: Number, default: 0 },
    dailyWage: { type: Number, required: true, min: 0 },
    amount: { type: Number, default: 0 },
    notes: String
  },
  { timestamps: true }
);

labourAttendanceSchema.pre('save', function calculate(next) {
  const base = this.attendance === 'Full Day' ? this.dailyWage : this.attendance === 'Half Day' ? this.dailyWage / 2 : 0;
  const overtime = Number(this.overtimeHours || 0) * (Number(this.dailyWage || 0) / 8);
  this.amount = Math.round((base + overtime) * 100) / 100;
  next();
});

export default mongoose.model('LabourAttendance', labourAttendanceSchema);
