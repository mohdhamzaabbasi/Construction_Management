import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import { exportPDF } from '../utils/export';
import { dateOnly, getName, rupee } from '../utils/format';

export default function ReportsPage() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => { api.get('/projects').then((res) => setProjects(res.data)); }, []);

  async function loadReport(id) {
    setSelected(id);
    if (!id) return setReport(null);
    const { data } = await api.get(`/reports/completed/${id}`);
    setReport(data);
  }

  const txColumns = [
    { key: 'date', label: 'Date', render: (r) => dateOnly(r.date) },
    { key: 'transactionType', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'moneyIn', label: 'Money In', render: (r) => r.moneyIn ? rupee(r.moneyIn) : '-' },
    { key: 'moneyOut', label: 'Money Out', render: (r) => r.moneyOut ? rupee(r.moneyOut) : '-' }
  ];

  function exportFinalPDF() {
    if (!report) return;
    exportPDF(`Completed Project Report - ${report.project.projectName}`, report.registers.transactions, txColumns);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Reports</h1><p>Completed project reports with summaries, register book, and export.</p></div>
        <button className="primary-btn" onClick={exportFinalPDF} disabled={!report}>Export Final Report PDF</button>
      </div>
      <section className="pay-strip">
        <select value={selected} onChange={(e) => loadReport(e.target.value)}>
          <option value="">Select Project</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.projectName} - {p.status}</option>)}
        </select>
      </section>
      {report && (
        <>
          <section className="report-summary">
            <h2>{report.project.projectName}</h2>
            <p>{report.project.siteLocation} | Client: {getName(report.project.client, report.project.clientNameSnapshot || '-')} | Generated: {dateOnly(report.generatedAt)}</p>
            <div className="summary-grid">
              <span>Contract: <strong>{rupee(report.totals.contractAmount)}</strong></span>
              <span>Received: <strong>{rupee(report.totals.totalReceived)}</strong></span>
              <span>Pending: <strong>{rupee(report.totals.pendingClientAmount)}</strong></span>
              <span>Total Expenditure: <strong>{rupee(report.totals.totalExpenditure)}</strong></span>
              <span>Final Profit/Loss: <strong>{rupee(report.totals.expectedProfit)}</strong></span>
            </div>
          </section>
          <DataTable title="Final Register Book" rows={report.registers.transactions} columns={txColumns} />
        </>
      )}
    </div>
  );
}
