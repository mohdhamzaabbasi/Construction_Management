import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Building2, HardHat, Home, LogOut, Package, Settings, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home', mobileLabel: 'Home', icon: Home },
  { to: '/sites', label: 'Sites', mobileLabel: 'Sites', icon: Building2 },
  { to: '/labour', label: 'Labour', mobileLabel: 'Labour', icon: HardHat },
  { to: '/material-catalog', label: 'Material', mobileLabel: 'Material', icon: Package },
  { to: '/vendors', label: 'Material Vendors', mobileLabel: 'Vendors', icon: Truck }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CP</div>
          <div>
            <strong>Construction Manager</strong>
            <span>{user?.name || 'Project Manager'}</span>
          </div>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink className="settings-link" to="/settings"><Settings size={18} /><span>Settings</span></NavLink>
        <button className="nav-logout" onClick={doLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>
      <header className="mobile-header">
        <div className="mobile-brand">
          <div className="brand-mark">CP</div>
          <div>
            <strong>Construction Manager</strong>
            <span>{user?.name || 'Project Manager'}</span>
          </div>
        </div>
        <button className="mobile-logout" onClick={doLogout} title="Logout">
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <nav className="mobile-nav">
        {links.map(({ to, label, mobileLabel, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon size={20} />
            <span>{mobileLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
