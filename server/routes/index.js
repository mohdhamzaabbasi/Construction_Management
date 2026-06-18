import express from 'express';
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
import { asyncHandler, requireFields, escapeRegex } from '../utils/http.js';
import { upsertTransaction, deleteTransaction } from '../utils/transactions.js';
import { getDashboardSummary, getProjectAnalytics } from '../utils/analytics.js';

const router = express.Router();
const paymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'];

function parseFilters(req, searchFields = [], defaultDateField = 'date') {
  const query = {};
  if (req.query.project) query.project = req.query.project;
  if (req.query.client) query.client = req.query.client;
  if (req.query.supplier) query.supplier = req.query.supplier;
  if (req.query.status) query.status = req.query.status;
  if (req.query.transactionType) query.transactionType = req.query.transactionType;
  if (req.query.from || req.query.to) {
    const dateKey = req.query.dateField || defaultDateField;
    query[dateKey] = {};
    if (req.query.from) query[dateKey].$gte = new Date(req.query.from);
    if (req.query.to) query[dateKey].$lte = new Date(req.query.to);
  }
  if (req.query.search && searchFields.length) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    query.$or = searchFields.map((field) => ({ [field]: rx }));
  }
  return query;
}

function crudRoutes(path, Model, options = {}) {
  router.get(path, asyncHandler(async (req, res) => {
    const items = await Model.find(parseFilters(req, options.searchFields)).populate(options.populate || '').sort(req.query.sort || '-createdAt');
    res.json(items);
  }));
  router.post(path, asyncHandler(async (req, res) => {
    requireFields(req.body, options.required || []);
    const item = await Model.create(req.body);
    res.status(201).json(await Model.findById(item._id).populate(options.populate || ''));
  }));
  router.put(`${path}/:id`, asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    if (options.softDelete && updates.status === 'Active') updates.deactivatedAt = null;
    const item = await Model.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate(options.populate || '');
    if (!item) return res.status(404).json({ message: 'Record not found' });
    res.json(item);
  }));
  router.delete(`${path}/:id`, asyncHandler(async (req, res) => {
    const item = options.softDelete
      ? await Model.findByIdAndUpdate(req.params.id, { status: 'Inactive', deactivatedAt: new Date() }, { new: true })
      : await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Record not found' });
    res.json({ ok: true, deactivated: Boolean(options.softDelete), item });
  }));
}

router.get('/dashboard', asyncHandler(async (req, res) => res.json(await getDashboardSummary())));

router.get('/clients', asyncHandler(async (req, res) => {
  const clients = await Client.find(parseFilters(req, ['clientName', 'phone', 'email', 'address'])).sort(req.query.sort || '-createdAt');
  res.json(clients);
}));

router.post('/clients', asyncHandler(async (req, res) => {
  requireFields(req.body, ['clientName', 'phone', 'address']);
  const client = await Client.create(req.body);
  res.status(201).json(client);
}));

router.put('/clients/:id', asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.status === 'Active') updates.deactivatedAt = null;
  const client = await Client.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
}));

router.delete('/clients/:id', asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(
    req.params.id,
    { status: 'Inactive', deactivatedAt: new Date() },
    { new: true }
  );
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json({ ok: true, deactivated: true, item: client });
}));
crudRoutes('/suppliers', Supplier, {
  required: ['supplierName', 'phone', 'address', 'materialCategory'],
  searchFields: ['supplierName', 'phone', 'materialCategory'],
  softDelete: true
});
crudRoutes('/labourers', Labourer, {
  required: ['labourName', 'skillType', 'dailyWage'],
  searchFields: ['labourName', 'phone', 'skillType'],
  softDelete: true
});
crudRoutes('/material-catalog', Material, {
  required: ['materialName', 'category', 'unit', 'defaultRate'],
  searchFields: ['materialName', 'category', 'notes'],
  populate: 'preferredSupplier',
  softDelete: true
});

router.get('/projects', asyncHandler(async (req, res) => {
  const query = parseFilters(req, ['projectName', 'siteLocation', 'notes']);
  const items = await Project.find(query).populate('client').sort(req.query.sort || '-createdAt');
  res.json(items);
}));

router.post('/projects', asyncHandler(async (req, res) => {
  requireFields(req.body, ['projectName', 'client', 'siteLocation', 'startDate', 'agreedContractAmount']);
  const client = await Client.findById(req.body.client);
  const item = await Project.create({ ...req.body, clientNameSnapshot: client?.clientName || req.body.clientNameSnapshot });
  res.status(201).json(await Project.findById(item._id).populate('client'));
}));

router.put('/projects/:id', asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.client) {
    const client = await Client.findById(updates.client);
    if (client) updates.clientNameSnapshot = client.clientName;
  }
  const item = await Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('client');
  if (!item) return res.status(404).json({ message: 'Project not found' });
  res.json(item);
}));

router.delete('/projects/:id', asyncHandler(async (req, res) => {
  const dependent = await Promise.all([
    MaterialPurchase.countDocuments({ project: req.params.id }),
    LabourAttendance.countDocuments({ project: req.params.id }),
    ClientPayment.countDocuments({ project: req.params.id }),
    OtherExpense.countDocuments({ project: req.params.id })
  ]);
  if (dependent.some(Boolean)) return res.status(409).json({ message: 'Project has financial records. Delete those records before deleting the project.' });
  await Project.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

router.get('/projects/:id/analytics', asyncHandler(async (req, res) => {
  const analytics = await getProjectAnalytics(req.params.id);
  if (!analytics) return res.status(404).json({ message: 'Project not found' });
  res.json(analytics);
}));

router.get('/clients/:id/summary', asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  const projects = await Project.find({ client: req.params.id });
  const payments = await ClientPayment.find({ client: req.params.id }).populate('project');
  const agreed = projects.reduce((t, p) => t + Number(p.agreedContractAmount || 0), 0);
  const received = payments.reduce((t, p) => t + Number(p.amountReceived || 0), 0);
  res.json({ client, linkedProjects: projects, totalAgreedAmount: agreed, totalReceivedAmount: received, pendingAmount: Math.max(agreed - received, 0), paymentHistory: payments });
}));

router.get('/suppliers/:id/summary', asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  const purchases = await MaterialPurchase.find({ supplier: req.params.id }).populate('project supplier');
  const totalPurchaseAmount = purchases.reduce((t, p) => t + Number(p.totalAmount || 0), 0);
  const pendingSupplierAmount = purchases.reduce((t, p) => t + Number(p.pendingAmount || 0), 0);
  res.json({ supplier, materialsPurchased: purchases, totalPurchaseAmount, pendingSupplierAmount });
}));

router.get('/labourers/:id/history', asyncHandler(async (req, res) => {
  const labourer = await Labourer.findById(req.params.id);
  if (!labourer) return res.status(404).json({ message: 'Labourer not found' });
  const [attendance, payments] = await Promise.all([
    LabourAttendance.find({ labourer: req.params.id }).populate('project').sort('-date'),
    LabourPayment.find({ labourer: req.params.id }).populate('project').sort('-attendanceDate')
  ]);
  const totalEarned = attendance.reduce((total, item) => total + Number(item.amount || 0), 0);
  const totalPaid = payments.reduce((total, item) => total + Number(item.amountPaid || 0), 0);
  res.json({ labourer, attendance, payments, totalEarned, totalPaid, pendingAmount: Math.max(totalEarned - totalPaid, 0) });
}));

router.get('/material-catalog/:id/history', asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).populate('preferredSupplier');
  if (!material) return res.status(404).json({ message: 'Material not found' });
  const purchases = await MaterialPurchase.find({
    $or: [{ material: material._id }, { materialName: material.materialName }]
  }).populate('project supplier').sort('-date');
  const totalQuantity = purchases.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const totalSpent = purchases.reduce((total, item) => total + Number(item.totalAmount || 0), 0);
  res.json({ material, purchases, totalQuantity, totalSpent });
}));

router.get('/materials', asyncHandler(async (req, res) => {
  const query = parseFilters(req, ['materialName', 'billInvoiceNumber', 'notes']);
  const items = await MaterialPurchase.find(query).populate('project supplier material').sort(req.query.sort || '-date');
  res.json(items);
}));

router.post('/materials', asyncHandler(async (req, res) => {
  requireFields(req.body, ['project', 'date', 'quantity', 'supplier', 'paymentMode']);
  const payload = { ...req.body };
  if (payload.material) {
    const material = await Material.findById(payload.material);
    if (!material) return res.status(400).json({ message: 'Selected material was not found' });
    payload.materialName = payload.materialName || material.materialName;
    payload.unit = payload.unit || material.unit;
    if (payload.ratePerUnit === undefined || payload.ratePerUnit === null || payload.ratePerUnit === '') payload.ratePerUnit = material.defaultRate;
  }
  requireFields(payload, ['materialName', 'unit', 'ratePerUnit']);
  const supplier = await Supplier.findById(payload.supplier);
  payload.supplierNameSnapshot = supplier?.supplierName || payload.supplierNameSnapshot;
  const item = await MaterialPurchase.create(payload);
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
  res.status(201).json(await MaterialPurchase.findById(item._id).populate('project supplier material'));
}));

router.put('/materials/:id', asyncHandler(async (req, res) => {
  const item = await MaterialPurchase.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Purchase not found' });
  Object.assign(item, req.body);
  if (req.body.supplier) {
    const supplier = await Supplier.findById(req.body.supplier);
    if (supplier) item.supplierNameSnapshot = supplier.supplierName;
  }
  await item.save();
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
  res.json(await MaterialPurchase.findById(item._id).populate('project supplier material'));
}));

router.delete('/materials/:id', asyncHandler(async (req, res) => {
  await MaterialPurchase.findByIdAndDelete(req.params.id);
  await deleteTransaction('MaterialPurchase', req.params.id);
  res.json({ ok: true });
}));

async function createLabourDue(attendance) {
  const labourer = await Labourer.findById(attendance.labourer);
  const due = await LabourPayment.findOneAndUpdate(
    { attendance: attendance._id },
    {
      attendance: attendance._id,
      attendanceDate: attendance.date,
      project: attendance.project,
      labourer: attendance.labourer,
      labourNameSnapshot: attendance.labourNameSnapshot || labourer?.labourName,
      amountDue: attendance.amount,
      status: 'UNPAID',
      amountPaid: 0
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return due;
}

async function syncAttendanceTransaction(item) {
  const labourer = await Labourer.findById(item.labourer);
  await upsertTransaction({
    sourceModel: 'LabourAttendance',
    sourceId: item._id,
    project: item.project,
    date: item.date,
    transactionType: 'Labour Attendance',
    description: `${labourer?.labourName || item.labourNameSnapshot || 'Labour'} - ${item.attendance}`,
    moneyOut: item.amount,
    paymentMode: 'Due',
    notes: item.notes
  });
}

router.get('/attendance', asyncHandler(async (req, res) => {
  const items = await LabourAttendance.find(parseFilters(req, ['notes'])).populate('project labourer').sort(req.query.sort || '-date');
  res.json(items);
}));

router.post('/attendance', asyncHandler(async (req, res) => {
  requireFields(req.body, ['project', 'date', 'labourer', 'attendance', 'dailyWage']);
  const labourer = await Labourer.findById(req.body.labourer);
  const item = await LabourAttendance.create({ ...req.body, labourNameSnapshot: labourer?.labourName || req.body.labourNameSnapshot });
  await createLabourDue(item);
  await syncAttendanceTransaction(item);
  res.status(201).json(await LabourAttendance.findById(item._id).populate('project labourer'));
}));

router.post('/attendance/bulk', asyncHandler(async (req, res) => {
  requireFields(req.body, ['project', 'date', 'attendance', 'labourers']);
  const labourers = await Labourer.find({ _id: { $in: req.body.labourers } });
  const created = [];
  for (const labourer of labourers) {
    const item = await LabourAttendance.create({
      project: req.body.project,
      date: req.body.date,
      labourer: labourer._id,
      labourNameSnapshot: labourer.labourName,
      attendance: req.body.attendance,
      overtimeHours: req.body.overtimeHours || 0,
      dailyWage: req.body.dailyWage || labourer.dailyWage,
      notes: req.body.notes
    });
    await createLabourDue(item);
    await syncAttendanceTransaction(item);
    created.push(item);
  }
  res.status(201).json(await LabourAttendance.find({ _id: { $in: created.map((x) => x._id) } }).populate('project labourer'));
}));

router.put('/attendance/:id', asyncHandler(async (req, res) => {
  const item = await LabourAttendance.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Attendance not found' });
  const paid = await LabourPayment.findOne({ attendance: item._id, status: 'PAID' });
  if (paid) return res.status(409).json({ message: 'Paid attendance cannot be edited. Reverse the payment first.' });
  Object.assign(item, req.body);
  if (req.body.labourer) {
    const labourer = await Labourer.findById(req.body.labourer);
    if (labourer) item.labourNameSnapshot = labourer.labourName;
  }
  await item.save();
  await createLabourDue(item);
  await syncAttendanceTransaction(item);
  res.json(await LabourAttendance.findById(item._id).populate('project labourer'));
}));

router.delete('/attendance/:id', asyncHandler(async (req, res) => {
  const paid = await LabourPayment.findOne({ attendance: req.params.id, status: 'PAID' });
  if (paid) return res.status(409).json({ message: 'Paid attendance cannot be deleted.' });
  await LabourAttendance.findByIdAndDelete(req.params.id);
  await LabourPayment.deleteOne({ attendance: req.params.id });
  await deleteTransaction('LabourAttendance', req.params.id);
  res.json({ ok: true });
}));

router.get('/labour-payments', asyncHandler(async (req, res) => {
  const query = parseFilters(req, ['notes'], 'attendanceDate');
  if (req.query.status) query.status = req.query.status;
  const items = await LabourPayment.find(query).populate('project labourer attendance').sort(req.query.sort || '-attendanceDate');
  res.json(items);
}));

async function markLabourPaid(id, paymentMode, paymentDate, notes = '') {
  if (!paymentModes.includes(paymentMode)) {
    const error = new Error('Valid payment mode is required');
    error.status = 400;
    throw error;
  }
  const item = await LabourPayment.findById(id).populate('labourer');
  if (!item) return null;
  item.status = 'PAID';
  item.amountPaid = item.amountDue;
  item.paymentMode = paymentMode;
  item.paymentDate = paymentDate || new Date();
  item.notes = notes || item.notes;
  await item.save();
  await upsertTransaction({
    sourceModel: 'LabourPayment',
    sourceId: item._id,
    project: item.project,
    date: item.paymentDate,
    transactionType: 'Labour Payment',
    description: `Paid ${item.labourer?.labourName || item.labourNameSnapshot || 'labour'}`,
    moneyOut: item.amountPaid,
    paymentMode: item.paymentMode,
    notes: item.notes
  });
  return item;
}

router.post('/labour-payments/:id/pay', asyncHandler(async (req, res) => {
  const item = await markLabourPaid(req.params.id, req.body.paymentMode, req.body.paymentDate, req.body.notes);
  if (!item) return res.status(404).json({ message: 'Labour due not found' });
  res.json(await LabourPayment.findById(item._id).populate('project labourer attendance'));
}));

router.post('/labour-payments/bulk-pay', asyncHandler(async (req, res) => {
  requireFields(req.body, ['ids', 'paymentMode']);
  const paid = [];
  for (const id of req.body.ids) paid.push(await markLabourPaid(id, req.body.paymentMode, req.body.paymentDate, req.body.notes));
  res.json(await LabourPayment.find({ _id: { $in: paid.filter(Boolean).map((x) => x._id) } }).populate('project labourer attendance'));
}));

router.put('/labour-payments/:id', asyncHandler(async (req, res) => {
  const item = await LabourPayment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('project labourer attendance');
  if (!item) return res.status(404).json({ message: 'Labour due not found' });
  if (item.status === 'PAID') {
    await upsertTransaction({
      sourceModel: 'LabourPayment',
      sourceId: item._id,
      project: item.project,
      date: item.paymentDate,
      transactionType: 'Labour Payment',
      description: `Paid ${item.labourer?.labourName || 'labour'}`,
      moneyOut: item.amountPaid,
      paymentMode: item.paymentMode,
      notes: item.notes
    });
  }
  res.json(item);
}));

router.get('/client-payments', asyncHandler(async (req, res) => {
  const items = await ClientPayment.find(parseFilters(req, ['referenceNumber', 'notes'])).populate('project client').sort(req.query.sort || '-date');
  res.json(items);
}));

router.post('/client-payments', asyncHandler(async (req, res) => {
  requireFields(req.body, ['project', 'client', 'date', 'amountReceived', 'paymentMode']);
  const client = await Client.findById(req.body.client);
  const item = await ClientPayment.create({ ...req.body, clientNameSnapshot: client?.clientName || req.body.clientNameSnapshot });
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
  res.status(201).json(await ClientPayment.findById(item._id).populate('project client'));
}));

router.put('/client-payments/:id', asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.client) {
    const client = await Client.findById(updates.client);
    if (client) updates.clientNameSnapshot = client.clientName;
  }
  const item = await ClientPayment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('project client');
  if (!item) return res.status(404).json({ message: 'Payment not found' });
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
  res.json(item);
}));

router.delete('/client-payments/:id', asyncHandler(async (req, res) => {
  await ClientPayment.findByIdAndDelete(req.params.id);
  await deleteTransaction('ClientPayment', req.params.id);
  res.json({ ok: true });
}));

router.get('/other-expenses', asyncHandler(async (req, res) => {
  const items = await OtherExpense.find(parseFilters(req, ['expenseCategory', 'description', 'notes'])).populate('project').sort(req.query.sort || '-date');
  res.json(items);
}));

router.post('/other-expenses', asyncHandler(async (req, res) => {
  requireFields(req.body, ['project', 'date', 'expenseCategory', 'description', 'amount', 'paymentMode']);
  const item = await OtherExpense.create(req.body);
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
  res.status(201).json(await OtherExpense.findById(item._id).populate('project'));
}));

router.put('/other-expenses/:id', asyncHandler(async (req, res) => {
  const item = await OtherExpense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('project');
  if (!item) return res.status(404).json({ message: 'Expense not found' });
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
  res.json(item);
}));

router.delete('/other-expenses/:id', asyncHandler(async (req, res) => {
  await OtherExpense.findByIdAndDelete(req.params.id);
  await deleteTransaction('OtherExpense', req.params.id);
  res.json({ ok: true });
}));

router.get('/transactions', asyncHandler(async (req, res) => {
  const query = parseFilters(req, ['description', 'notes']);
  const items = await Transaction.find(query).populate('project').sort(req.query.sort || 'date');
  let running = 0;
  const withBalance = items.map((item) => {
    running += Number(item.moneyIn || 0) - Number(item.moneyOut || 0);
    return { ...item.toObject(), balance: running };
  });
  res.json(withBalance);
}));

router.get('/reports/completed/:projectId', asyncHandler(async (req, res) => {
  const analytics = await getProjectAnalytics(req.params.projectId);
  if (!analytics) return res.status(404).json({ message: 'Project not found' });
  res.json({ generatedAt: new Date(), ...analytics });
}));

export default router;
