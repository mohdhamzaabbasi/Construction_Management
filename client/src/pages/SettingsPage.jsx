import { useAuth } from '../context/AuthContext';
import React from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="page">
      <div className="page-head"><div><h1>Settings / Profile</h1><p>Manager account and app setup details.</p></div></div>
      <section className="table-panel settings-panel">
        <h2>Profile</h2>
        <div className="summary-grid">
          <span>Name: <strong>{user?.name}</strong></span>
          <span>Username: <strong>{user?.username}</strong></span>
          <span>Role: <strong>{user?.role}</strong></span>
        </div>
        <h2>Environment</h2>
        <div className="summary-grid">
          <span>API URL: <strong>{import.meta.env.VITE_API_URL || '/api'}</strong></span>
          <span>Currency: <strong>Indian Rupee</strong></span>
        </div>
      </section>
    </div>
  );
}
