import React from 'react';
import { rupee } from '../utils/format';

export default function StatCard({ label, value, tone = 'neutral', money = true }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{money ? rupee(value) : value}</strong>
    </div>
  );
}
