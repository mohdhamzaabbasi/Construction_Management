import React, { useEffect, useState } from 'react';
import { CalendarDays, Edit, MapPin, Plus, Search, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import FormModal from '../components/FormModal';
import { dateOnly, getName, rupee } from '../utils/format';

export default function SitesPage() {
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState('');

  function load() {
    Promise.all([
      api.get('/projects', { params: { search, status } }),
      api.get('/clients')
    ]).then(([siteRes, clientRes]) => {
      setSites(siteRes.data);
      setClients(clientRes.data);
    });
  }

  useEffect(() => {
    const timeout = setTimeout(load, 200);
    return () => clearTimeout(timeout);
  }, [search, status]);

  const fields = [
    { name: 'projectName', label: 'Site / Project Name', required: true },
    {
      name: 'client',
      label: 'Client',
      type: 'select',
      options: clients.map((client) => ({
        value: client._id,
        label: `${client.clientName}${client.status === 'Inactive' ? ' (Inactive)' : ''}`,
        disabled: client.status === 'Inactive'
      })),
      required: true
    },
    { name: 'siteLocation', label: 'Site Location', required: true },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'expectedEndDate', label: 'Expected End Date', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'On Hold'], required: true },
    { name: 'estimatedBudget', label: 'Estimated Budget', type: 'number', min: 0 },
    { name: 'agreedContractAmount', label: 'Contract Amount', type: 'number', min: 0, required: true },
    { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
  ];

  async function save(event) {
    event.preventDefault();
    if (modal._id) await api.put(`/projects/${modal._id}`, modal);
    else await api.post('/projects', modal);
    setModal(null);
    setMessage('Site saved successfully');
    load();
  }

  async function remove(site) {
    if (!confirm(`Delete ${site.projectName}?`)) return;
    try {
      await api.delete(`/projects/${site._id}`);
      setMessage('Site deleted');
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete site');
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Sites</h1><p>Active, on-hold and completed construction sites.</p></div>
        <div className="page-head-actions">
          <Link className="ghost-btn" to="/clients"><Users size={18} /> Manage Clients</Link>
          <button className="primary-btn" onClick={() => setModal({ status: 'Active', startDate: new Date().toISOString().slice(0, 10) })}><Plus size={18} /> Add Site</button>
        </div>
      </div>
      {message && <div className="alert">{message}</div>}
      <div className="directory-tools">
        <label className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search site or location" /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Active</option><option>On Hold</option><option>Completed</option>
        </select>
      </div>
      <div className="site-grid">
        {sites.map((site) => (
          <article className="site-card" key={site._id}>
            <div className="site-card-head">
              <span className={`site-status ${site.status.toLowerCase().replace(' ', '-')}`}>{site.status}</span>
              <div className="row-actions">
                <button className="icon-btn" title="Edit site" onClick={() => setModal({ ...site, client: site.client?._id || site.client })}><Edit size={16} /></button>
                <button className="icon-btn danger" title="Delete site" onClick={() => remove(site)}><Trash2 size={16} /></button>
              </div>
            </div>
            <Link to={`/sites/${site._id}`} className="site-card-body">
              <h2>{site.projectName}</h2>
              <p className="site-client">{getName(site.client, site.clientNameSnapshot || '-')}</p>
              <div className="site-meta"><MapPin size={16} /><span>{site.siteLocation}</span></div>
              <div className="site-meta"><CalendarDays size={16} /><span>{dateOnly(site.startDate)} to {dateOnly(site.expectedEndDate)}</span></div>
              <div className="site-money">
                <span>Contract value</span>
                <strong>{rupee(site.agreedContractAmount)}</strong>
              </div>
            </Link>
          </article>
        ))}
        {!sites.length && <div className="empty-state"><BuildingEmpty /> <h2>No sites found</h2><p>Add a site or change the current filters.</p></div>}
      </div>
      {modal && <FormModal title={modal._id ? 'Edit Site' : 'Add New Site'} fields={fields} value={modal} setValue={setModal} onSubmit={save} onClose={() => setModal(null)} />}
    </div>
  );
}

function BuildingEmpty() {
  return <span className="empty-icon"><MapPin size={28} /></span>;
}
