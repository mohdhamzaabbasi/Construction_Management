import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { ExpensePie, MonthlyChart } from '../components/Charts';
import { dateOnly, getName, rupee } from '../utils/format';

export default function ProjectDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/projects/${id}/analytics`).then((res) => setData(res.data)); }, [id]);
  if (!data) return <div className="loading">Loading project analytics...</div>;
  const { project, totals, charts, registers } = data;
  const txColumns = [
    { key: 'date', label: 'Date', render: (r) => dateOnly(r.date) },
    { key: 'transactionType', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'moneyIn', label: 'Money In', render: (r) => r.moneyIn ? rupee(r.moneyIn) : '-' },
    { key: 'moneyOut', label: 'Money Out', render: (r) => r.moneyOut ? rupee(r.moneyOut) : '-' },
    { key: 'paymentMode', label: 'Mode' }
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{project.projectName}</h1>
          <p>{project.siteLocation} | {getName(project.client, project.clientNameSnapshot || '-')} | {project.status}</p>
        </div>
        <Link className="ghost-btn" to="/projects">Back</Link>
      </div>
      <div className="detail-strip">
        <span>Start: {dateOnly(project.startDate)}</span>
        <span>Expected End: {dateOnly(project.expectedEndDate)}</span>
        <span>Notes: {project.notes || '-'}</span>
      </div>
      <div className="stat-grid">
        <StatCard label="Contract Amount" value={totals.contractAmount} />
        <StatCard label="Total Received" value={totals.totalReceived} tone="good" />
        <StatCard label="Pending Client Amount" value={totals.pendingClientAmount} tone="pending" />
        <StatCard label="Material Cost" value={totals.materialCost} tone="bad" />
        <StatCard label="Labour Attendance Cost" value={totals.labourAttendanceCost} tone="bad" />
        <StatCard label="Labour Paid Amount" value={totals.labourPaidAmount} tone="bad" />
        <StatCard label="Pending Labour Payment" value={totals.pendingLabourPayment} tone="pending" />
        <StatCard label="Other Expenses" value={totals.otherExpenses} tone="bad" />
        <StatCard label="Total Expenditure" value={totals.totalExpenditure} tone="bad" />
        <StatCard label="Profit Based on Received" value={totals.profitBasedOnReceived} tone={totals.profitBasedOnReceived >= 0 ? 'good' : 'bad'} />
        <StatCard label="Expected Profit/Loss" value={totals.expectedProfit} tone={totals.expectedProfit >= 0 ? 'good' : 'bad'} />
        <StatCard label="Profit Percentage" value={`${totals.profitPercentage.toFixed(1)}%`} money={false} />
      </div>
      <div className="chart-grid">
        <ExpensePie data={charts.expenseBreakdown} />
        <MonthlyChart data={charts.monthlyExpense} />
      </div>
      <div className="mini-grid">
        <DataTable title="Top 5 Materials by Cost" rows={charts.topMaterials} columns={[{ key: 'name', label: 'Material' }, { key: 'value', label: 'Cost', render: (r) => rupee(r.value) }]} />
        <DataTable title="Supplier-wise Expense" rows={charts.supplierExpense} columns={[{ key: 'name', label: 'Supplier' }, { key: 'value', label: 'Cost', render: (r) => rupee(r.value) }]} />
      </div>
      <DataTable title="Full Transaction Register" rows={registers.transactions} columns={txColumns} />
    </div>
  );
}
