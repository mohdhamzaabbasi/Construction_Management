import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ResourcePage from './pages/ResourcePage';
import ProjectDetails from './pages/ProjectDetails';
import AttendancePage from './pages/AttendancePage';
import LabourPaymentsPage from './pages/LabourPaymentsPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import SitesPage from './pages/SitesPage';
import DirectoryPage from './pages/DirectoryPage';
import SiteWorkspace from './pages/SiteWorkspace';
import { resources } from './pages/resourceConfig.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="sites" element={<SitesPage />} />
        <Route path="sites/:id" element={<SiteWorkspace />} />
        <Route path="labour" element={<DirectoryPage type="labour" />} />
        <Route path="material-catalog" element={<DirectoryPage type="material" />} />
        <Route path="vendors" element={<DirectoryPage type="vendor" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<ResourcePage config={resources.projects} />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="clients" element={<ResourcePage config={resources.clients} />} />
        <Route path="suppliers" element={<ResourcePage config={resources.suppliers} />} />
        <Route path="materials" element={<ResourcePage config={resources.materials} />} />
        <Route path="labourers" element={<ResourcePage config={resources.labourers} />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="labour-payments" element={<LabourPaymentsPage />} />
        <Route path="client-payments" element={<ResourcePage config={resources.clientPayments} />} />
        <Route path="other-expenses" element={<ResourcePage config={resources.otherExpenses} />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
