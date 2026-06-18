import React from 'react';
import { ArrowDownUp, Download, FileText, Printer, Search } from 'lucide-react';
import { exportCSV, exportPDF } from '../utils/export';

export default function DataTable({ title, rows = [], columns = [], search, onSearch, filters, actions, empty = 'No records found' }) {
  const fileBase = title.toLowerCase().replace(/\s+/g, '-');
  return (
    <section className="table-panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p>{rows.length} record{rows.length === 1 ? '' : 's'}</p>
        </div>
        <div className="table-actions">
          {actions}
          <button className="icon-btn" onClick={() => exportCSV(`${fileBase}.csv`, rows, columns)} title="Export CSV">
            <Download size={18} />
          </button>
          <button className="icon-btn" onClick={() => exportPDF(title, rows, columns)} title="Export PDF">
            <FileText size={18} />
          </button>
          <button className="icon-btn" onClick={() => window.print()} title="Print">
            <Printer size={18} />
          </button>
        </div>
      </div>
      <div className="filters">
        {onSearch && (
          <label className="search-box">
            <Search size={16} />
            <input value={search || ''} onChange={(e) => onSearch(e.target.value)} placeholder="Search" />
          </label>
        )}
        {filters}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>
                  <span>{col.label}</span>
                  {col.sortable && <ArrowDownUp size={13} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row._id || JSON.stringify(row)}>
                  {columns.map((col) => (
                    <td key={col.key} data-label={col.label}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-cell" colSpan={columns.length}>{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
