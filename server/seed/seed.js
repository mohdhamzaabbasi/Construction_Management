import mongoose from 'mongoose';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Supplier from '../models/Supplier.js';
import Material from '../models/Material.js';
import MaterialPurchase from '../models/MaterialPurchase.js';
import Labourer from '../models/Labourer.js';
import LabourAttendance from '../models/LabourAttendance.js';
import LabourPayment from '../models/LabourPayment.js';
import ClientPayment from '../models/ClientPayment.js';
import OtherExpense from '../models/OtherExpense.js';
import Transaction from '../models/Transaction.js';
import { upsertTransaction } from '../utils/transactions.js';
import { env } from '../config/env.js';

async function run() {
  await mongoose.connect(env.mongoUri);
  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    Project.deleteMany({}),
    Supplier.deleteMany({}),
    Material.deleteMany({}),
    MaterialPurchase.deleteMany({}),
    Labourer.deleteMany({}),
    LabourAttendance.deleteMany({}),
    LabourPayment.deleteMany({}),
    ClientPayment.deleteMany({}),
    OtherExpense.deleteMany({}),
    Transaction.deleteMany({})
  ]);

  await User.create({ name: 'Admin Manager', username: 'admin', password: 'admin123', role: 'Manager', phone: '9999999999' });

  const clients = await Client.insertMany([
    { clientName: 'Sharma Developers', phone: '9876543210', email: 'office@sharmadev.example', address: 'Nashik Road, Maharashtra', notes: 'Apartment block client' },
    { clientName: 'Patel Family Trust', phone: '9123456780', address: 'Civil Lines, Pune', notes: 'Residential bungalow' }
  ]);

  const suppliers = await Supplier.insertMany([
    { supplierName: 'Om Cement Traders', phone: '9988776655', address: 'Market Yard', materialCategory: 'Cement and steel' },
    { supplierName: 'Sai Sand Depot', phone: '8877665544', address: 'Ring Road', materialCategory: 'Sand and aggregate' }
  ]);

  const materialCatalog = await Material.insertMany([
    { materialName: 'Cement OPC 53', category: 'Cement', unit: 'bags', defaultRate: 410, preferredSupplier: suppliers[0]._id, notes: 'Standard RCC cement' },
    { materialName: 'River Sand', category: 'Sand', unit: 'loads', defaultRate: 15500, preferredSupplier: suppliers[1]._id },
    { materialName: 'Paint Primer', category: 'Paint', unit: 'kg', defaultRate: 180, preferredSupplier: suppliers[0]._id }
  ]);

  const projects = await Project.insertMany([
    {
      projectName: 'Sharma Heights Wing A',
      client: clients[0]._id,
      clientNameSnapshot: clients[0].clientName,
      siteLocation: 'Nashik Road Site',
      startDate: new Date('2026-01-10'),
      expectedEndDate: new Date('2026-11-30'),
      status: 'Active',
      estimatedBudget: 4200000,
      agreedContractAmount: 5500000,
      notes: 'RCC and finishing work'
    },
    {
      projectName: 'Patel Bungalow Renovation',
      client: clients[1]._id,
      clientNameSnapshot: clients[1].clientName,
      siteLocation: 'Pune Civil Lines',
      startDate: new Date('2026-02-05'),
      expectedEndDate: new Date('2026-07-20'),
      status: 'Active',
      estimatedBudget: 1300000,
      agreedContractAmount: 1850000,
      notes: 'Interior, plumbing, electrical and paint'
    }
  ]);

  const labourers = await Labourer.insertMany([
    { labourName: 'Ramesh Pawar', phone: '9000000001', skillType: 'Mason', dailyWage: 900, status: 'Active' },
    { labourName: 'Suresh Jadhav', phone: '9000000002', skillType: 'Helper', dailyWage: 550, status: 'Active' },
    { labourName: 'Iqbal Shaikh', phone: '9000000003', skillType: 'Electrician', dailyWage: 1000, status: 'Active' }
  ]);

  const materials = await MaterialPurchase.create([
    { project: projects[0]._id, material: materialCatalog[0]._id, date: new Date('2026-03-02'), materialName: 'Cement OPC 53', quantity: 200, unit: 'bags', ratePerUnit: 410, supplier: suppliers[0]._id, supplierNameSnapshot: suppliers[0].supplierName, paymentMode: 'UPI', paidAmount: 60000, billInvoiceNumber: 'OCT-101', notes: 'Foundation pour' },
    { project: projects[0]._id, material: materialCatalog[1]._id, date: new Date('2026-03-08'), materialName: 'River Sand', quantity: 3, unit: 'loads', ratePerUnit: 15500, supplier: suppliers[1]._id, supplierNameSnapshot: suppliers[1].supplierName, paymentMode: 'Credit', paidAmount: 20000, billInvoiceNumber: 'SSD-88' },
    { project: projects[1]._id, material: materialCatalog[2]._id, date: new Date('2026-03-12'), materialName: 'Paint Primer', quantity: 40, unit: 'kg', ratePerUnit: 180, supplier: suppliers[0]._id, supplierNameSnapshot: suppliers[0].supplierName, paymentMode: 'Cash', paidAmount: 7200 }
  ]);

  for (const item of materials) {
    await upsertTransaction({
      sourceModel: 'MaterialPurchase',
      sourceId: item._id,
      project: item.project,
      date: item.date,
      transactionType: 'Material',
      description: `${item.materialName} - ${item.quantity} ${item.unit}`,
      moneyOut: item.totalAmount,
      paymentMode: item.paymentMode,
      notes: item.notes
    });
  }

  const attendance = await LabourAttendance.create([
    { project: projects[0]._id, date: new Date('2026-03-15'), labourer: labourers[0]._id, labourNameSnapshot: labourers[0].labourName, attendance: 'Full Day', overtimeHours: 1, dailyWage: 900, notes: 'Slab shuttering' },
    { project: projects[0]._id, date: new Date('2026-03-15'), labourer: labourers[1]._id, labourNameSnapshot: labourers[1].labourName, attendance: 'Full Day', dailyWage: 550 },
    { project: projects[1]._id, date: new Date('2026-03-16'), labourer: labourers[2]._id, labourNameSnapshot: labourers[2].labourName, attendance: 'Half Day', dailyWage: 1000, notes: 'Wiring inspection' }
  ]);

  for (const item of attendance) {
    const labourer = labourers.find((x) => String(x._id) === String(item.labourer));
    await LabourPayment.create({ attendance: item._id, attendanceDate: item.date, project: item.project, labourer: item.labourer, labourNameSnapshot: labourer.labourName, amountDue: item.amount });
    await upsertTransaction({
      sourceModel: 'LabourAttendance',
      sourceId: item._id,
      project: item.project,
      date: item.date,
      transactionType: 'Labour Attendance',
      description: `${labourer.labourName} - ${item.attendance}`,
      moneyOut: item.amount,
      paymentMode: 'Due',
      notes: item.notes
    });
  }

  const clientPayments = await ClientPayment.create([
    { project: projects[0]._id, client: clients[0]._id, clientNameSnapshot: clients[0].clientName, date: new Date('2026-03-20'), amountReceived: 1000000, paymentMode: 'Bank Transfer', referenceNumber: 'NEFT-5521', notes: 'Mobilization payment' },
    { project: projects[1]._id, client: clients[1]._id, clientNameSnapshot: clients[1].clientName, date: new Date('2026-03-21'), amountReceived: 450000, paymentMode: 'Cheque', referenceNumber: 'CHQ-2115' }
  ]);

  for (const item of clientPayments) {
    await upsertTransaction({
      sourceModel: 'ClientPayment',
      sourceId: item._id,
      project: item.project,
      date: item.date,
      transactionType: 'Client Payment',
      description: 'Client received amount',
      moneyIn: item.amountReceived,
      paymentMode: item.paymentMode,
      notes: item.notes
    });
  }

  const others = await OtherExpense.create([
    { project: projects[0]._id, date: new Date('2026-03-18'), expenseCategory: 'Transport', description: 'Material transport tempo', amount: 5200, paymentMode: 'Cash' },
    { project: projects[1]._id, date: new Date('2026-03-19'), expenseCategory: 'Food', description: 'Tea and lunch for crew', amount: 1800, paymentMode: 'UPI' }
  ]);

  for (const item of others) {
    await upsertTransaction({
      sourceModel: 'OtherExpense',
      sourceId: item._id,
      project: item.project,
      date: item.date,
      transactionType: 'Other Expense',
      description: `${item.expenseCategory} - ${item.description}`,
      moneyOut: item.amount,
      paymentMode: item.paymentMode,
      notes: item.notes
    });
  }

  console.log('Seed complete. Login with username: admin password: admin123');
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
