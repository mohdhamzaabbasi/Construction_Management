import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import FormModal from '../components/FormModal';
import { dateOnly, getName, rupee } from '../utils/format';

export default function AttendancePage() {
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [labourers, setLabourers] = useState([]);
  const [modal, setModal] = useState(null);
  const [bulk, setBulk] = useState({ project: '', date: new Date().toISOString().slice(0, 10), attendance: 'Full Day', labourers: [] });
  const [message, setMessage] = useState('');

  function load() {
    Promise.all([api.get('/attendance'), api.get('/projects'), api.get('/labourers')]).then(([a, p, l]) => {
      setRows(a.data);
      setProjects(p.data);
      setLabourers(l.data);
    });
  }
  useEffect(load, []);

  const fields = [
    { name: 'project', label: 'Site', type: 'select', options: projects.map((p) => ({ value: p._id, label: p.projectName })), required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'labourer', label: 'Labour', type: 'select', options: labourers.map((l) => ({ value: l._id, label: `${l.labourName} - ${rupee(l.dailyWage)}` })), required: true },
    { name: 'attendance', label: 'Attendance', type: 'select', options: ['Full Day', 'Half Day', 'Absent'], required: true },
    { name: 'overtimeHours', label: 'Overtime Hours', type: 'number', min: 0 },
    { name: 'dailyWage', label: 'Daily Wage', type: 'number', min: 0, required: true },
    { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
  ];

  async function save(e) {
    e.preventDefault();
    const chosen = labourers.find((l) => l._id === modal.labourer);
    const payload = { ...modal, dailyWage: modal.dailyWage || chosen?.dailyWage || 0 };
    if (modal._id) await api.put(`/attendance/${modal._id}`, payload);
    else await api.post('/attendance', payload);
    setModal(null);
    setMessage('Attendance saved and labour due updated');
    load();
  }

  async function submitBulk(e) {
    e.preventDefault();
    await api.post('/attendance/bulk', bulk);
    setMessage('Bulk attendance added and unpaid dues generated');
    setBulk({ ...bulk, labourers: [] });
    load();
  }

  const columns = [
    { key: 'date', label: 'Date', render: (r) => dateOnly(r.date) },
    { key: 'project', label: 'Site', render: (r) => getName(r.project) },
    { key: 'labourer', label: 'Labour', render: (r) => getName(r.labourer, r.labourNameSnapshot || '-') },
    { key: 'attendance', label: 'Attendance' },
    { key: 'dailyWage', label: 'Daily Wage', render: (r) => rupee(r.dailyWage) },
    { key: 'amount', label: 'Amount', render: (r) => rupee(r.amount) }
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Labour Attendance</h1><p>Attendance and payment dues are separate workflows.</p></div>
        <button className="primary-btn" onClick={() => setModal({ date: new Date().toISOString().slice(0, 10), attendance: 'Full Day' })}><Plus size={18} /> Add Individual</button>
      </div>
      {message && <div className="alert">{message}</div>}
      <section className="table-panel">
        <div className="panel-head"><div><h2>Bulk Attendance</h2><p>Select multiple labourers and mark together.</p></div></div>
        <form className="bulk-form" onSubmit={submitBulk}>
          <select value={bulk.project} onChange={(e) => setBulk({ ...bulk, project: e.target.value })} required>
            <option value="">Select Site</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.projectName}</option>)}
          </select>
          <input type="date" value={bulk.date} onChange={(e) => setBulk({ ...bulk, date: e.target.value })} required />
          <select value={bulk.attendance} onChange={(e) => setBulk({ ...bulk, attendance: e.target.value })}>
            {['Full Day', 'Half Day', 'Absent'].map((x) => <option key={x}>{x}</option>)}
          </select>
          <div className="check-grid">
            {labourers.filter((l) => l.status === 'Active').map((labourer) => (
              <label key={labourer._id} className="check-card">
                <input
                  type="checkbox"
                  checked={bulk.labourers.includes(labourer._id)}
                  onChange={(e) => setBulk({ ...bulk, labourers: e.target.checked ? [...bulk.labourers, labourer._id] : bulk.labourers.filter((id) => id !== labourer._id) })}
                />
                <span>{labourer.labourName}</span>
                <small>{labourer.skillType} · {rupee(labourer.dailyWage)}</small>
              </label>
            ))}
          </div>
          <button className="primary-btn" disabled={!bulk.labourers.length}>Mark Selected</button>
        </form>
      </section>
      <DataTable title="Attendance Register" rows={rows} columns={columns} />
      {modal && <FormModal title="Add Attendance" fields={fields} value={modal} setValue={setModal} onSubmit={save} onClose={() => setModal(null)} />}
    </div>
  );
}
