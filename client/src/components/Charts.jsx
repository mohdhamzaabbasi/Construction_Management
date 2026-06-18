import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { rupee } from '../utils/format';

const colors = ['#0f766e', '#dc2626', '#f59e0b', '#2563eb', '#7c3aed'];

export function ExpensePie({ data = [] }) {
  return (
    <div className="chart-box">
      <h3>Expense Breakdown</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data.filter((d) => d.value > 0)} dataKey="value" nameKey="name" outerRadius={90} label>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => rupee(v)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyChart({ data = [] }) {
  return (
    <div className="chart-box">
      <h3>Monthly Expense</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip formatter={(v) => rupee(v)} />
          <Line type="monotone" dataKey="amount" stroke="#dc2626" strokeWidth={3} />
          <Line type="monotone" dataKey="material" stroke="#0f766e" strokeWidth={2} />
          <Line type="monotone" dataKey="labour" stroke="#f59e0b" strokeWidth={2} />
          <Line type="monotone" dataKey="other" stroke="#2563eb" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProfitChart({ data = [] }) {
  return (
    <div className="chart-box">
      <h3>Project-wise Profit/Loss</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip formatter={(v) => rupee(v)} />
          <Bar dataKey="profit" fill="#0f766e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
