import Project from '../models/Project.js';
import MaterialPurchase from '../models/MaterialPurchase.js';
import LabourAttendance from '../models/LabourAttendance.js';
import LabourPayment from '../models/LabourPayment.js';
import ClientPayment from '../models/ClientPayment.js';
import OtherExpense from '../models/OtherExpense.js';
import Transaction from '../models/Transaction.js';

const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);

export async function getProjectAnalytics(projectId) {
  const project = await Project.findById(projectId).populate('client');
  if (!project) return null;
  const [materials, attendance, labourPayments, clientPayments, others, transactions] = await Promise.all([
    MaterialPurchase.find({ project: projectId }).populate('supplier').sort({ date: -1 }),
    LabourAttendance.find({ project: projectId }).populate('labourer').sort({ date: -1 }),
    LabourPayment.find({ project: projectId }).populate('labourer').sort({ attendanceDate: -1 }),
    ClientPayment.find({ project: projectId }).sort({ date: -1 }),
    OtherExpense.find({ project: projectId }).sort({ date: -1 }),
    Transaction.find({ project: projectId }).sort({ date: -1, createdAt: -1 })
  ]);

  const materialCost = sum(materials, 'totalAmount');
  const labourAttendanceCost = sum(attendance, 'amount');
  const labourPaidAmount = sum(labourPayments, 'amountPaid');
  const otherExpenses = sum(others, 'amount');
  const totalReceived = sum(clientPayments, 'amountReceived');
  const totalExpenditure = materialCost + labourAttendanceCost + otherExpenses;
  const contractAmount = Number(project.agreedContractAmount || 0);
  const pendingClientAmount = Math.max(contractAmount - totalReceived, 0);
  const pendingLabourPayment = Math.max(labourAttendanceCost - labourPaidAmount, 0);
  const profitBasedOnReceived = totalReceived - totalExpenditure;
  const expectedProfit = contractAmount - totalExpenditure;

  const byMonth = {};
  [...materials.map((x) => ({ date: x.date, material: x.totalAmount })), ...attendance.map((x) => ({ date: x.date, labour: x.amount })), ...others.map((x) => ({ date: x.date, other: x.amount }))].forEach((row) => {
    const key = new Date(row.date).toISOString().slice(0, 7);
    byMonth[key] = byMonth[key] || { month: key, material: 0, labour: 0, other: 0 };
    byMonth[key].material += row.material || 0;
    byMonth[key].labour += row.labour || 0;
    byMonth[key].other += row.other || 0;
  });

  const materialMap = {};
  materials.forEach((m) => {
    materialMap[m.materialName] = (materialMap[m.materialName] || 0) + m.totalAmount;
  });
  const supplierMap = {};
  materials.forEach((m) => {
    const name = m.supplier?.supplierName || m.supplierNameSnapshot || 'Unassigned';
    supplierMap[name] = (supplierMap[name] || 0) + m.totalAmount;
  });

  return {
    project,
    totals: {
      contractAmount,
      totalReceived,
      pendingClientAmount,
      materialCost,
      labourAttendanceCost,
      labourPaidAmount,
      pendingLabourPayment,
      otherExpenses,
      totalExpenditure,
      profitBasedOnReceived,
      expectedProfit,
      profitPercentage: contractAmount ? (expectedProfit / contractAmount) * 100 : 0
    },
    charts: {
      expenseBreakdown: [
        { name: 'Material', value: materialCost },
        { name: 'Labour', value: labourAttendanceCost },
        { name: 'Other', value: otherExpenses }
      ],
      monthlyExpense: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
      topMaterials: Object.entries(materialMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
      supplierExpense: Object.entries(supplierMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    },
    registers: { materials, attendance, labourPayments, clientPayments, others, transactions }
  };
}

export async function getDashboardSummary() {
  const [projects, materials, attendance, clientPayments, others, transactions] = await Promise.all([
    Project.find().populate('client'),
    MaterialPurchase.find().populate('project supplier'),
    LabourAttendance.find().populate('project labourer'),
    ClientPayment.find().populate('project client'),
    OtherExpense.find().populate('project'),
    Transaction.find().populate('project').sort({ date: -1, createdAt: -1 }).limit(8)
  ]);
  const totalContract = sum(projects, 'agreedContractAmount');
  const totalReceived = sum(clientPayments, 'amountReceived');
  const materialExpense = sum(materials, 'totalAmount');
  const labourExpense = sum(attendance, 'amount');
  const otherExpense = sum(others, 'amount');
  const totalProjectCost = materialExpense + labourExpense + otherExpense;
  const byProject = await Promise.all(projects.map(async (project) => {
    const analytics = await getProjectAnalytics(project._id);
    return { name: project.projectName, profit: analytics.totals.expectedProfit, receivedProfit: analytics.totals.profitBasedOnReceived };
  }));

  const monthMap = {};
  [...materials.map((x) => ({ date: x.date, amount: x.totalAmount })), ...attendance.map((x) => ({ date: x.date, amount: x.amount })), ...others.map((x) => ({ date: x.date, amount: x.amount }))].forEach((row) => {
    const month = new Date(row.date).toISOString().slice(0, 7);
    monthMap[month] = (monthMap[month] || 0) + row.amount;
  });

  return {
    cards: {
      activeProjects: projects.filter((p) => p.status === 'Active').length,
      totalReceived,
      materialExpense,
      labourExpense,
      otherExpense,
      totalProjectCost,
      profitLoss: totalReceived - totalProjectCost,
      pendingClientAmount: Math.max(totalContract - totalReceived, 0)
    },
    recentTransactions: transactions,
    charts: {
      projectProfit: byProject,
      expenseBreakdown: [
        { name: 'Material', value: materialExpense },
        { name: 'Labour', value: labourExpense },
        { name: 'Other', value: otherExpense }
      ],
      monthlyExpense: Object.entries(monthMap).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month))
    }
  };
}
