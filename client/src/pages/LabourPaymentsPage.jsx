import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import { dateOnly, getName, rupee } from '../utils/format';
import { paymentModes } from './resourceConfig.jsx';

export default function LabourPaymentsPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('UNPAID');
  const [selected, setSelected] = useState([]);
  const [pay, setPay] = useState({ paymentMode: 'Cash', paymentDate: new Date().toISOString().slice(0, 10), notes: '' });
  const [message, setMessage] = useState('');

  function load() {
    api.get('/labour-payments', { params: { status } }).then((res) => setRows(res.data));
  }
  useEffect(load, [status]);

  async function payOne(id) {
    await api.post(`/labour-payments/${id}/pay`, pay);
    setMessage('Labour due marked as paid');
    load();
  }

  async function bulkPay() {
    await api.post('/labour-payments/bulk-pay', { ...pay, ids: selected });
    setSelected([]);
    setMessage('Selected labour dues marked as paid');
    load();
  }

  const columns = [
    { key: 'select', label: '', render: (r) => r.status === 'UNPAID' ? <input type="checkbox" checked={selected.includes(r._id)} onChange={(e) => setSelected(e.target.checked ? [...selected, r._id] : selected.filter((id) => id !== r._id))} /> : null },
    { key: 'attendanceDate', label: 'Attendance Date', render: (r) => dateOnly(r.attendanceDate) },
    { key: 'project', label: 'Site', render: (r) => getName(r.project) },
    { key: 'labourer', label: 'Labour', render: (r) => getName(r.labourer, r.labourNameSnapshot || '-') },
    { key: 'amountDue', label: 'Amount Due', render: (r) => rupee(r.amountDue) },
    { key: 'amountPaid', label: 'Amount Paid', render: (r) => rupee(r.amountPaid) },
    { key: 'status', label: 'Status', render: (r) => <span className={`pill ${r.status === 'PAID' ? 'good' : 'pending'}`}>{r.status}</span> },
    { key: 'paymentDate', label: 'Payment Date', render: (r) => dateOnly(r.paymentDate) },
    { key: 'actions', label: 'Action', render: (r) => r.status === 'UNPAID' ? <button className="small-btn" onClick={() => payOne(r._id)}>Pay</button> : '-' }
  ];

  return (
    <div className="page">
      <div className="page-head"><div><h1>Labour Payments</h1><p>Unpaid entries are generated from labour attendance.</p></div></div>
      {message && <div className="alert">{message}</div>}
      <section className="pay-strip">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
        </select>
        <select value={pay.paymentMode} onChange={(e) => setPay({ ...pay, paymentMode: e.target.value })}>
          {paymentModes.map((x) => <option key={x}>{x}</option>)}
        </select>
        <input type="date" value={pay.paymentDate} onChange={(e) => setPay({ ...pay, paymentDate: e.target.value })} />
        <input placeholder="Notes" value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} />
        <button className="primary-btn" disabled={!selected.length} onClick={bulkPay}>Pay Selected</button>
      </section>
      <DataTable title="Labour Payment Register" rows={rows} columns={columns} />
    </div>
  );
}
