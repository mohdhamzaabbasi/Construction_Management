import React from 'react';
import { Link } from 'react-router-dom';
import { dateOnly, getName, rupee } from '../utils/format';

export const paymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'];
export const projectStatuses = ['Active', 'Completed', 'On Hold'];
export const units = ['bags', 'kg', 'tons', 'pieces', 'cubic feet', 'brass', 'loads'];
export const skills = ['Mason', 'Helper', 'Painter', 'Carpenter', 'Electrician', 'Plumber', 'Supervisor', 'Other'];
export const expenseCategories = ['Transport', 'Food', 'Equipment Rent', 'Machine', 'Fuel', 'Contractor', 'Permit', 'Miscellaneous'];

const projectSelect = { name: 'project', label: 'Site', type: 'select', source: '/projects', required: true };
const clientSelect = { name: 'client', label: 'Client', type: 'select', source: '/clients', required: true };
const supplierSelect = { name: 'supplier', label: 'Supplier/Vendor', type: 'select', source: '/suppliers', required: true };

export const resources = {
  projects: {
    title: 'Projects / Sites',
    endpoint: '/projects',
    fields: [
      { name: 'projectName', label: 'Project Name', required: true },
      clientSelect,
      { name: 'siteLocation', label: 'Site Location', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'expectedEndDate', label: 'Expected End Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: projectStatuses, required: true },
      { name: 'estimatedBudget', label: 'Estimated Budget', type: 'number', min: 0 },
      { name: 'agreedContractAmount', label: 'Agreed Contract Amount', type: 'number', min: 0, required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ],
    columns: [
      { key: 'projectName', label: 'Project', render: (r) => <Link to={`/projects/${r._id}`}>{r.projectName}</Link> },
      { key: 'client', label: 'Client', render: (r) => getName(r.client, r.clientNameSnapshot || '-') },
      { key: 'siteLocation', label: 'Site' },
      { key: 'status', label: 'Status', render: (r) => <span className={`pill ${r.status === 'Completed' ? 'good' : r.status === 'On Hold' ? 'pending' : ''}`}>{r.status}</span> },
      { key: 'agreedContractAmount', label: 'Contract', render: (r) => rupee(r.agreedContractAmount) },
      { key: 'startDate', label: 'Start', render: (r) => dateOnly(r.startDate) }
    ],
    filters: [{ key: 'status', label: 'Status', options: projectStatuses }]
  },
  clients: {
    title: 'Clients',
    endpoint: '/clients',
    fields: [
      { name: 'clientName', label: 'Client Name', required: true },
      { name: 'phone', label: 'Phone Number', required: true },
      { name: 'email', label: 'Email' },
      { name: 'address', label: 'Address', type: 'textarea', required: true, wide: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ],
    columns: [
      { key: 'clientName', label: 'Client' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' },
      { key: 'status', label: 'Status', render: (r) => <span className={`pill ${r.status === 'Active' ? 'good' : ''}`}>{r.status || 'Active'}</span> },
      { key: 'notes', label: 'Notes' }
    ],
    filters: [{ key: 'status', label: 'Status', options: ['Active', 'Inactive'] }],
    softDelete: true
  },
  suppliers: {
    title: 'Suppliers / Vendors',
    endpoint: '/suppliers',
    fields: [
      { name: 'supplierName', label: 'Supplier Name', required: true },
      { name: 'phone', label: 'Phone Number', required: true },
      { name: 'address', label: 'Address', type: 'textarea', required: true, wide: true },
      { name: 'materialCategory', label: 'Material Category', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ],
    columns: [
      { key: 'supplierName', label: 'Supplier' },
      { key: 'phone', label: 'Phone' },
      { key: 'materialCategory', label: 'Category' },
      { key: 'address', label: 'Address' }
    ]
  },
  materials: {
    title: 'Material Purchases',
    endpoint: '/materials',
    fields: [
      projectSelect,
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'materialName', label: 'Material Name', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', min: 0, required: true },
      { name: 'unit', label: 'Unit', type: 'select', options: units, required: true },
      { name: 'ratePerUnit', label: 'Rate Per Unit', type: 'number', min: 0, required: true },
      supplierSelect,
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', options: paymentModes, required: true },
      { name: 'paidAmount', label: 'Paid Amount', type: 'number', min: 0 },
      { name: 'billInvoiceNumber', label: 'Bill/Invoice Number' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ],
    columns: [
      { key: 'date', label: 'Date', render: (r) => dateOnly(r.date) },
      { key: 'project', label: 'Site', render: (r) => getName(r.project) },
      { key: 'materialName', label: 'Material' },
      { key: 'quantity', label: 'Qty', render: (r) => `${r.quantity} ${r.unit}` },
      { key: 'supplier', label: 'Supplier', render: (r) => getName(r.supplier, r.supplierNameSnapshot || '-') },
      { key: 'totalAmount', label: 'Total', render: (r) => rupee(r.totalAmount) },
      { key: 'pendingAmount', label: 'Pending', render: (r) => rupee(r.pendingAmount) }
    ],
    filters: [{ key: 'project', label: 'Site', source: '/projects' }, { key: 'supplier', label: 'Supplier', source: '/suppliers' }]
  },
  labourers: {
    title: 'Labourers',
    endpoint: '/labourers',
    fields: [
      { name: 'labourName', label: 'Labour Name', required: true },
      { name: 'phone', label: 'Phone' },
      { name: 'skillType', label: 'Skill/Type', type: 'select', options: skills, required: true },
      { name: 'dailyWage', label: 'Daily Wage', type: 'number', min: 0, required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true }
    ],
    columns: [
      { key: 'labourName', label: 'Labour' },
      { key: 'phone', label: 'Phone' },
      { key: 'skillType', label: 'Skill' },
      { key: 'dailyWage', label: 'Daily Wage', render: (r) => rupee(r.dailyWage) },
      { key: 'status', label: 'Status' }
    ],
    filters: [{ key: 'status', label: 'Status', options: ['Active', 'Inactive'] }]
  },
  clientPayments: {
    title: 'Client Payments',
    endpoint: '/client-payments',
    fields: [
      projectSelect,
      clientSelect,
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'amountReceived', label: 'Client Received Amount', type: 'number', min: 0, required: true },
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', options: paymentModes, required: true },
      { name: 'referenceNumber', label: 'Reference Number' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ],
    columns: [
      { key: 'date', label: 'Date', render: (r) => dateOnly(r.date) },
      { key: 'project', label: 'Site', render: (r) => getName(r.project) },
      { key: 'client', label: 'Client', render: (r) => getName(r.client, r.clientNameSnapshot || '-') },
      { key: 'amountReceived', label: 'Amount', render: (r) => rupee(r.amountReceived) },
      { key: 'paymentMode', label: 'Mode' },
      { key: 'referenceNumber', label: 'Reference' }
    ],
    filters: [{ key: 'project', label: 'Site', source: '/projects' }]
  },
  otherExpenses: {
    title: 'Other Expenses',
    endpoint: '/other-expenses',
    fields: [
      projectSelect,
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'expenseCategory', label: 'Expense Category', type: 'select', options: expenseCategories, required: true },
      { name: 'description', label: 'Description', required: true },
      { name: 'amount', label: 'Amount', type: 'number', min: 0, required: true },
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', options: paymentModes, required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ],
    columns: [
      { key: 'date', label: 'Date', render: (r) => dateOnly(r.date) },
      { key: 'project', label: 'Site', render: (r) => getName(r.project) },
      { key: 'expenseCategory', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount', render: (r) => rupee(r.amount) },
      { key: 'paymentMode', label: 'Mode' }
    ],
    filters: [{ key: 'project', label: 'Site', source: '/projects' }]
  }
};
