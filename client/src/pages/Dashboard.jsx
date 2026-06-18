import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { ExpensePie, MonthlyChart, ProfitChart } from '../components/Charts';
import { dateOnly, getName, rupee } from '../utils/format';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  const cards = data?.cards || {};
  const recentColumns = [
    { key: 'date', label: 'Date', render: (r) => dateOnly(r.date) },
    { key: 'project', label: 'Site', render: (r) => getName(r.project) },
    { key: 'transactionType', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'moneyIn', label: 'Money In', render: (r) => r.moneyIn ? rupee(r.moneyIn) : '-' },
    { key: 'moneyOut', label: 'Money Out', render: (r) => r.moneyOut ? rupee(r.moneyOut) : '-' }
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Overall money received, site expenses, dues, and profit/loss.</p>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard label="Active Projects" value={cards.activeProjects} money={false} />
        <StatCard label="Client Received Amount" value={cards.totalReceived} tone="good" />
        <StatCard label="Material Expense" value={cards.materialExpense} tone="bad" />
        <StatCard label="Labour Expense" value={cards.labourExpense} tone="bad" />
        <StatCard label="Other Expense" value={cards.otherExpense} tone="bad" />
        <StatCard label="Total Project Cost" value={cards.totalProjectCost} tone="bad" />
        <StatCard label="Total Profit/Loss" value={cards.profitLoss} tone={cards.profitLoss >= 0 ? 'good' : 'bad'} />
        <StatCard label="Pending From Clients" value={cards.pendingClientAmount} tone="pending" />
      </div>
      <div className="chart-grid">
        <ProfitChart data={data.charts.projectProfit} />
        <ExpensePie data={data.charts.expenseBreakdown} />
        <MonthlyChart data={data.charts.monthlyExpense} />
      </div>
      <DataTable title="Recent Transactions" rows={data.recentTransactions || []} columns={recentColumns} />
    </div>
  );
}
