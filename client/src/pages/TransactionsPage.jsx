import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import { dateOnly, getName, rupee } from '../utils/format';

export default function TransactionsPage() {
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ search: '', project: '', transactionType: '', from: '', to: '' });

  useEffect(() => { api.get('/projects').then((res) => setProjects(res.data)); }, []);
  useEffect(() => {
    const t = setTimeout(() => api.get('/transactions', { params: filters }).then((res) => setRows(res.data)), 250);
    return () => clearTimeout(t);
  }, [JSON.stringify(filters)]);

  const columns = [
    { key: 'date', label: 'Date', render: (r) => dateOnly(r.date) },
    { key: 'project', label: 'Project/Site', render: (r) => getName(r.project) },
    { key: 'transactionType', label: 'Transaction Type' },
    { key: 'description', label: 'Description' },
    { key: 'moneyIn', label: 'Money In', render: (r) => r.moneyIn ? rupee(r.moneyIn) : '-' },
    { key: 'moneyOut', label: 'Money Out', render: (r) => r.moneyOut ? rupee(r.moneyOut) : '-' },
    { key: 'balance', label: 'Balance/Net', render: (r) => rupee(r.balance) },
    { key: 'paymentMode', label: 'Payment Mode' },
    { key: 'notes', label: 'Notes' }
  ];

  return (
    <div className="page">
      <div className="page-head"><div><h1>Transaction Register Book</h1><p>Chronological money-in and money-out register.</p></div></div>
      <DataTable
        title="Transaction Register"
        rows={rows}
        columns={columns}
        search={filters.search}
        onSearch={(value) => setFilters({ ...filters, search: value })}
        filters={
          <>
            <select value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}>
              <option value="">All Sites</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.projectName}</option>)}
            </select>
            <select value={filters.transactionType} onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}>
              <option value="">All Types</option>
              {['Material', 'Labour Attendance', 'Labour Payment', 'Client Payment', 'Other Expense'].map((x) => <option key={x}>{x}</option>)}
            </select>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </>
        }
      />
    </div>
  );
}
