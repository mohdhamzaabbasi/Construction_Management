import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Project from '../models/Project.js';
import MaterialPurchase from '../models/MaterialPurchase.js';
import LabourAttendance from '../models/LabourAttendance.js';
import LabourPayment from '../models/LabourPayment.js';
import ClientPayment from '../models/ClientPayment.js';
import Transaction from '../models/Transaction.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import Labourer from '../models/Labourer.js';

async function run() {
  await mongoose.connect(env.mongoUri);

  const projects = await Project.find({ clientNameSnapshot: { $in: [null, ''] } }).populate('client');
  for (const project of projects) {
    if (project.client?.clientName) {
      project.clientNameSnapshot = project.client.clientName;
      await project.save();
    }
  }

  const purchases = await MaterialPurchase.find({ supplierNameSnapshot: { $in: [null, ''] } }).populate('supplier');
  for (const purchase of purchases) {
    if (purchase.supplier?.supplierName) {
      purchase.supplierNameSnapshot = purchase.supplier.supplierName;
      await purchase.save();
    }
  }

  const attendanceRows = await LabourAttendance.find({ labourNameSnapshot: { $in: [null, ''] } }).populate('labourer');
  for (const attendance of attendanceRows) {
    let name = attendance.labourer?.labourName;
    if (!name) {
      const transaction = await Transaction.findOne({
        sourceModel: 'LabourAttendance',
        sourceId: attendance._id
      });
      const suffix = ` - ${attendance.attendance}`;
      if (transaction?.description?.endsWith(suffix)) {
        name = transaction.description.slice(0, -suffix.length);
      }
    }
    if (name) {
      attendance.labourNameSnapshot = name;
      await attendance.save();
    }
  }

  const payments = await LabourPayment.find({ labourNameSnapshot: { $in: [null, ''] } }).populate('labourer attendance');
  for (const payment of payments) {
    const name = payment.labourer?.labourName || payment.attendance?.labourNameSnapshot;
    if (name) {
      payment.labourNameSnapshot = name;
      await payment.save();
    }
  }

  const clientPayments = await ClientPayment.find({ clientNameSnapshot: { $in: [null, ''] } }).populate('client');
  for (const payment of clientPayments) {
    if (payment.client?.clientName) {
      payment.clientNameSnapshot = payment.client.clientName;
      await payment.save();
    }
  }

  console.log(JSON.stringify({
    projects: projects.length,
    purchases: purchases.length,
    attendance: attendanceRows.length,
    labourPayments: payments.length,
    clientPayments: clientPayments.length
  }));
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
