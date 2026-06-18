import React, { useEffect, useState } from 'react';
import { Archive, Edit, Eye, Plus, Search, X } from 'lucide-react';
import api from '../utils/api';
import FormModal from '../components/FormModal';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import { dateOnly, getName, rupee } from '../utils/format';
import { skills, units } from './resourceConfig.jsx';

const definitions = {
  labour: {
    title: 'Labour',
    singular: 'Labourer',
    endpoint: '/labourers',
    history: (id) => `/labourers/${id}/history`,
    fields: [
      { name: 'labourName', label: 'Labour Name', required: true },
      { name: 'phone', label: 'Phone Number' },
      { name: 'skillType', label: 'Skill / Type', type: 'select', options: skills, required: true },
      { name: 'dailyWage', label: 'Daily Wage', type: 'number', min: 0, required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true }
    ],
    columns: [
      { key: 'labourName', label: 'Name' },
      { key: 'skillType', label: 'Skill' },
      { key: 'phone', label: 'Phone' },
      { key: 'dailyWage', label: 'Daily Wage', render: (row) => rupee(row.dailyWage) },
      { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> }
    ]
  },
  material: {
    title: 'Material',
    singular: 'Material',
    endpoint: '/material-catalog',
    history: (id) => `/material-catalog/${id}/history`,
    fields: [
      { name: 'materialName', label: 'Material Name', required: true },
      { name: 'category', label: 'Category', required: true },
      { name: 'unit', label: 'Default Unit', type: 'select', options: units, required: true },
      { name: 'defaultRate', label: 'Default Rate', type: 'number', min: 0, required: true },
      { name: 'preferredSupplier', label: 'Preferred Vendor', type: 'select', source: '/suppliers' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ],
    columns: [
      { key: 'materialName', label: 'Material' },
      { key: 'category', label: 'Category' },
      { key: 'unit', label: 'Unit' },
      { key: 'defaultRate', label: 'Default Rate', render: (row) => `${rupee(row.defaultRate)} / ${row.unit}` },
      { key: 'preferredSupplier', label: 'Preferred Vendor', render: (row) => getName(row.preferredSupplier) },
      { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> }
    ]
  },
  vendor: {
    title: 'Material Vendors',
    singular: 'Vendor',
    endpoint: '/suppliers',
    history: (id) => `/suppliers/${id}/summary`,
    fields: [
      { name: 'supplierName', label: 'Vendor Name', required: true },
      { name: 'phone', label: 'Phone Number', required: true },
      { name: 'address', label: 'Address', type: 'textarea', required: true, wide: true },
      { name: 'materialCategory', label: 'Material Category', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ],
    columns: [
      { key: 'supplierName', label: 'Vendor' },
      { key: 'materialCategory', label: 'Materials' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> }
    ]
  }
};

export default function DirectoryPage({ type }) {
  const definition = definitions[type];
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [history, setHistory] = useState(null);
  const [options, setOptions] = useState({});
  const [message, setMessage] = useState('');

  function load() {
    api.get(definition.endpoint, { params: { search } }).then((response) => setRows(response.data));
  }

  useEffect(() => {
    setSearch('');
    setHistory(null);
    load();
    const sources = definition.fields.filter((field) => field.source).map((field) => field.source);
    Promise.all(sources.map((source) => api.get(source).then((response) => [source, response.data]))).then((pairs) => setOptions(Object.fromEntries(pairs)));
  }, [type]);

  useEffect(() => {
    const timeout = setTimeout(load, 200);
    return () => clearTimeout(timeout);
  }, [search]);

  const fields = definition.fields.map((field) => field.source ? {
    ...field,
    options: (options[field.source] || []).map((item) => ({
      value: item._id,
      label: `${getName(item)}${item.status === 'Inactive' ? ' (Inactive)' : ''}`,
      disabled: item.status === 'Inactive'
    }))
  } : field);

  async function save(event) {
    event.preventDefault();
    if (modal._id) await api.put(`${definition.endpoint}/${modal._id}`, modal);
    else await api.post(definition.endpoint, modal);
    setModal(null);
    setMessage(`${definition.singular} saved successfully`);
    load();
  }

  async function remove(row) {
    if (!confirm(`Mark this ${definition.singular.toLowerCase()} as inactive? Existing site and transaction history will be preserved.`)) return;
    await api.delete(`${definition.endpoint}/${row._id}`);
    setMessage(`${definition.singular} marked inactive. Historical records are preserved.`);
    load();
  }

  async function openHistory(row) {
    const response = await api.get(definition.history(row._id));
    setHistory({ type, row, data: response.data });
  }

  const columns = [
    ...definition.columns,
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button className="icon-btn" title="View history" onClick={() => openHistory(row)}><Eye size={16} /></button>
          <button className="icon-btn" title="Edit" onClick={() => setModal({ ...row, preferredSupplier: row.preferredSupplier?._id || row.preferredSupplier })}><Edit size={16} /></button>
          {row.status !== 'Inactive' && <button className="icon-btn danger" title="Mark inactive" onClick={() => remove(row)}><Archive size={16} /></button>}
        </div>
      )
    }
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{definition.title}</h1><p>Master records, editable rates and complete transaction history.</p></div>
        <button className="primary-btn" onClick={() => setModal({ status: 'Active' })}><Plus size={18} /> Add {definition.singular}</button>
      </div>
      {message && <div className="alert">{message}</div>}
      <div className="directory-tools">
        <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${definition.title.toLowerCase()}`} /></label>
      </div>
      <DataTable title={`${definition.title} Directory`} rows={rows} columns={columns} />
      {modal && <FormModal title={`${modal._id ? 'Edit' : 'Add'} ${definition.singular}`} fields={fields} value={modal} setValue={setModal} onSubmit={save} onClose={() => setModal(null)} />}
      {history && <HistoryPanel history={history} close={() => setHistory(null)} />}
    </div>
  );
}

function StatusPill({ status = 'Active' }) {
  return <span className={`pill ${status === 'Active' ? 'good' : ''}`}>{status}</span>;
}

function HistoryPanel({ history, close }) {
  const { type, data } = history;
  let stats = [];
  let rows = [];
  let columns = [];
  if (type === 'labour') {
    stats = [['Total Earned', data.totalEarned], ['Total Paid', data.totalPaid], ['Pending', data.pendingAmount]];
    rows = data.attendance || [];
    columns = [
      { key: 'date', label: 'Date', render: (row) => dateOnly(row.date) },
      { key: 'project', label: 'Site', render: (row) => getName(row.project) },
      { key: 'attendance', label: 'Attendance' },
      { key: 'amount', label: 'Earned', render: (row) => rupee(row.amount) }
    ];
  } else {
    const purchases = data.purchases || data.materialsPurchased || [];
    stats = type === 'material'
      ? [['Total Spent', data.totalSpent], ['Purchase Entries', purchases.length, false]]
      : [['Total Purchase', data.totalPurchaseAmount], ['Pending Amount', data.pendingSupplierAmount]];
    rows = purchases;
    columns = [
      { key: 'date', label: 'Date', render: (row) => dateOnly(row.date) },
      { key: 'project', label: 'Site', render: (row) => getName(row.project) },
      { key: 'materialName', label: 'Material' },
      { key: 'quantity', label: 'Quantity', render: (row) => `${row.quantity} ${row.unit}` },
      { key: 'totalAmount', label: 'Amount', render: (row) => rupee(row.totalAmount) },
      { key: 'pendingAmount', label: 'Pending', render: (row) => rupee(row.pendingAmount) }
    ];
  }
  return (
    <div className="modal-backdrop">
      <div className="history-modal">
        <div className="modal-head"><h2>Transaction History</h2><button className="icon-btn" onClick={close}><X size={18} /></button></div>
        <div className="stat-grid compact">
          {stats.map(([label, value, money = true]) => <StatCard key={label} label={label} value={value} money={money} tone={label.includes('Pending') ? 'pending' : 'neutral'} />)}
        </div>
        <DataTable title="History" rows={rows} columns={columns} />
      </div>
    </div>
  );
}
