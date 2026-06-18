import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED'
          ? 'The server took too long to respond. Please try again.'
          : 'Cannot connect to the server. Please make sure the app server is running.')
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <Building2 size={34} />
          <div>
            <h1>Construction Project Expense & Profit Manager</h1>
            <p>Login to your site accounts</p>
          </div>
        </div>
        <label><span>Username</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></label>
        <label><span>Password</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-btn" disabled={busy}>{busy ? 'Please wait...' : 'Login'}</button>
      </form>
    </main>
  );
}
