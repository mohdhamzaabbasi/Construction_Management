import React from 'react';
import { ArrowRight, Building2, HardHat, Package, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sections = [
  { to: '/sites', title: 'Sites', text: 'Open active and completed sites, dashboards, attendance, payments and purchases.', icon: Building2, tone: 'blue' },
  { to: '/labour', title: 'Labour', text: 'Manage labour profiles, wages, status, attendance and payment history.', icon: HardHat, tone: 'green' },
  { to: '/material-catalog', title: 'Material', text: 'Maintain materials, units and default rates used during site purchasing.', icon: Package, tone: 'orange' },
  { to: '/vendors', title: 'Material Vendors', text: 'Manage suppliers and review their complete purchase and pending history.', icon: Truck, tone: 'red' }
];

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div className="page home-page">
      <div className="welcome-head">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <h1>Good day, {user?.name?.split(' ')[0] || 'Manager'}</h1>
          <p>Choose where you want to work.</p>
        </div>
      </div>
      <div className="section-grid">
        {sections.map(({ to, title, text, icon: Icon, tone }) => (
          <Link className={`section-tile ${tone}`} to={to} key={to}>
            <div className="section-icon"><Icon size={30} /></div>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
            <ArrowRight className="section-arrow" size={22} />
          </Link>
        ))}
      </div>
    </div>
  );
}
