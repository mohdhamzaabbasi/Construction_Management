import React, { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import FormModal from '../components/FormModal';
import { getName } from '../utils/format';

export default function ResourcePage({ config }) {
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const optionSources = useMemo(() => {
    const all = [...(config.fields || []), ...(config.filters || [])].filter((x) => x.source);
    return [...new Set(all.map((x) => x.source))];
  }, [config]);

  useEffect(() => {
    Promise.all(optionSources.map((src) => api.get(src).then((res) => [src, res.data]))).then((pairs) => {
      setOptions(Object.fromEntries(pairs));
    });
  }, [optionSources.join('|')]);

  function load() {
    setLoading(true);
    const params = { search, ...filters };
    api.get(config.endpoint, { params }).then((res) => setRows(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [config.endpoint, search, JSON.stringify(filters)]);

  const fields = config.fields.map((field) => {
    if (!field.source) return field;
    return { ...field, options: (options[field.source] || []).map((item) => ({ value: item._id, label: getName(item) })) };
  });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (modal._id) await api.put(`${config.endpoint}/${modal._id}`, modal);
      else await api.post(config.endpoint, modal);
      setMessage('Saved successfully');
      setModal(null);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(row) {
    const prompt = config.softDelete
      ? 'Mark this record as inactive? Existing history will remain available.'
      : 'Delete this record?';
    if (!confirm(prompt)) return;
    try {
      await api.delete(`${config.endpoint}/${row._id}`);
      setMessage(config.softDelete ? 'Marked inactive. Historical records are preserved.' : 'Deleted successfully');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Delete failed');
    }
  }

  const columns = [
    ...config.columns,
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button className="icon-btn" onClick={() => setModal(row)} title="Edit"><Edit size={16} /></button>
          {(!config.softDelete || row.status !== 'Inactive') && <button className="icon-btn danger" onClick={() => remove(row)} title={config.softDelete ? 'Mark inactive' : 'Delete'}><Trash2 size={16} /></button>}
        </div>
      )
    }
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{config.title}</h1>
          <p>Search, filter, record, export, and print site data.</p>
        </div>
        <button className="primary-btn" onClick={() => setModal({ status: config.title.includes('Project') || config.softDelete ? 'Active' : undefined })}>
          <Plus size={18} />
          Add
        </button>
      </div>
      {message && <div className="alert">{message}</div>}
      {loading ? <div className="loading">Loading records...</div> : (
        <DataTable
          title={config.title}
          rows={rows}
          columns={columns}
          search={search}
          onSearch={setSearch}
          filters={(config.filters || []).map((filter) => {
            const opts = filter.source ? (options[filter.source] || []).map((x) => ({ value: x._id, label: getName(x) })) : filter.options.map((x) => ({ value: x, label: x }));
            return (
              <select key={filter.key} value={filters[filter.key] || ''} onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}>
                <option value="">{filter.label}: All</option>
                {opts.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            );
          })}
        />
      )}
      {modal && <FormModal title={`${modal._id ? 'Edit' : 'Add'} ${config.title}`} fields={fields} value={modal} setValue={setModal} onSubmit={save} onClose={() => setModal(null)} busy={busy} />}
    </div>
  );
}
