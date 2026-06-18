import React from 'react';
import { X } from 'lucide-react';
import { inputDate } from '../utils/format';

export default function FormModal({ title, fields, value, setValue, onSubmit, onClose, busy }) {
  function update(name, next) {
    setValue((old) => ({ ...old, [name]: next }));
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={onSubmit}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          {fields.map((field) => (
            <label key={field.name} className={field.wide ? 'wide' : ''}>
              <span>{field.label}</span>
              {field.type === 'select' ? (
                <select value={value[field.name] || ''} onChange={(e) => update(field.name, e.target.value)} required={field.required}>
                  <option value="">Select</option>
                  {field.options.map((opt) => (
                    <option key={opt.value ?? opt} value={opt.value ?? opt} disabled={Boolean(opt.disabled)}>{opt.label ?? opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea value={value[field.name] || ''} onChange={(e) => update(field.name, e.target.value)} required={field.required} />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={field.type === 'date' ? inputDate(value[field.name]) : value[field.name] ?? ''}
                  onChange={(e) => update(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  required={field.required}
                  min={field.min}
                />
              )}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
