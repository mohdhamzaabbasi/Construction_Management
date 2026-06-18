import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardCheck, CreditCard, IndianRupee, PackagePlus, Plus, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import FormModal from '../components/FormModal';
import { ExpensePie, MonthlyChart } from '../components/Charts';
import { dateOnly, getName, rupee } from '../utils/format';
import { paymentModes } from './resourceConfig.jsx';

const tabs = [
  ['overview', 'Dashboard'],
  ['attendance', 'Attendance'],
  ['payments', 'Labour Payments'],
  ['materials', 'Material Purchases'],
  ['client-payments', 'Client Payments'],
  ['register', 'Site Register']
];

export default function SiteWorkspace() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [labourers, setLabourers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [clientPayments, setClientPayments] = useState([]);
  const [action, setAction] = useState(null);
  const [purchase, setPurchase] = useState(null);
  const [clientPayment, setClientPayment] = useState(null);
  const [selectedDues, setSelectedDues] = useState([]);
  const [message, setMessage] = useState('');

  function load() {
    Promise.all([
      api.get(`/projects/${id}/analytics`),
      api.get('/labourers', { params: { status: 'Active' } }),
      api.get('/material-catalog', { params: { status: 'Active' } }),
      api.get('/suppliers', { params: { status: 'Active' } }),
      api.get('/attendance', { params: { project: id } }),
      api.get('/labour-payments', { params: { project: id } }),
      api.get('/materials', { params: { project: id } }),
      api.get('/client-payments', { params: { project: id } })
    ]).then(([analyticsRes, labourRes, materialRes, supplierRes, attendanceRes, paymentRes, purchaseRes, clientPaymentRes]) => {
      setData(analyticsRes.data);
      setLabourers(labourRes.data);
      setMaterials(materialRes.data);
      setSuppliers(supplierRes.data);
      setAttendance(attendanceRes.data);
      setPayments(paymentRes.data);
      setPurchases(purchaseRes.data);
      setClientPayments(clientPaymentRes.data);
    });
  }

  useEffect(load, [id]);
  if (!data) return <div className="loading">Opening site workspace...</div>;

  const { project, totals, charts, registers } = data;
  const attendanceFields = [
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'labourer', label: 'Labour', type: 'select', options: labourers.map((item) => ({ value: item._id, label: `${item.labourName} - ${rupee(item.dailyWage)}` })), required: true },
    { name: 'attendance', label: 'Attendance', type: 'select', options: ['Full Day', 'Half Day', 'Absent'], required: true },
    { name: 'overtimeHours', label: 'Overtime Hours', type: 'number', min: 0 },
    { name: 'dailyWage', label: 'Daily Wage', type: 'number', min: 0 },
    { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
  ];

  async function saveAttendance(event) {
    event.preventDefault();
    const labourer = labourers.find((item) => item._id === action.labourer);
    await api.post('/attendance', { ...action, project: id, dailyWage: action.dailyWage || labourer?.dailyWage || 0 });
    setAction(null);
    setMessage('Attendance marked and labour payment due created');
    load();
  }

  function chooseMaterial(materialId) {
    const material = materials.find((item) => item._id === materialId);
    setPurchase((old) => ({
      ...old,
      material: materialId,
      materialName: material?.materialName || '',
      unit: material?.unit || '',
      ratePerUnit: material?.defaultRate || 0,
      supplier: material?.preferredSupplier?._id || old.supplier || ''
    }));
  }

  async function savePurchase(event) {
    event.preventDefault();
    await api.post('/materials', { ...purchase, project: id });
    setPurchase(null);
    setMessage('Material purchase added to this site and transaction register');
    load();
  }

  async function saveClientPayment(event) {
    event.preventDefault();
    const clientId = project.client?._id || project.client;
    if (!clientId) {
      setMessage('This site has no active client reference. Edit the site and select a client first.');
      return;
    }
    await api.post('/client-payments', {
      ...clientPayment,
      project: id,
      client: clientId
    });
    setClientPayment(null);
    setMessage('Client received amount saved and added to the site register');
    load();
  }

  async function payDues(ids) {
    if (!ids.length) return;
    await api.post('/labour-payments/bulk-pay', {
      ids,
      paymentMode: 'Cash',
      paymentDate: new Date().toISOString().slice(0, 10)
    });
    setSelectedDues([]);
    setMessage('Selected labour dues marked as paid');
    load();
  }

  const attendanceColumns = [
    { key: 'date', label: 'Date', render: (row) => dateOnly(row.date) },
    { key: 'labourer', label: 'Labour', render: (row) => getName(row.labourer, row.labourNameSnapshot || '-') },
    { key: 'attendance', label: 'Attendance' },
    { key: 'dailyWage', label: 'Daily Wage', render: (row) => rupee(row.dailyWage) },
    { key: 'amount', label: 'Amount', render: (row) => rupee(row.amount) }
  ];
  const paymentColumns = [
    { key: 'select', label: '', render: (row) => row.status === 'UNPAID' ? <input type="checkbox" checked={selectedDues.includes(row._id)} onChange={(event) => setSelectedDues(event.target.checked ? [...selectedDues, row._id] : selectedDues.filter((due) => due !== row._id))} /> : null },
    { key: 'attendanceDate', label: 'Attendance Date', render: (row) => dateOnly(row.attendanceDate) },
    { key: 'labourer', label: 'Labour', render: (row) => getName(row.labourer, row.labourNameSnapshot || '-') },
    { key: 'amountDue', label: 'Due', render: (row) => rupee(row.amountDue) },
    { key: 'amountPaid', label: 'Paid', render: (row) => rupee(row.amountPaid) },
    { key: 'status', label: 'Status', render: (row) => <span className={`pill ${row.status === 'PAID' ? 'good' : 'pending'}`}>{row.status}</span> },
    { key: 'action', label: 'Action', render: (row) => row.status === 'UNPAID' ? <button className="small-btn" onClick={() => payDues([row._id])}>Pay Now</button> : <CheckCircle2 size={18} className="paid-icon" /> }
  ];
  const purchaseColumns = [
    { key: 'date', label: 'Date', render: (row) => dateOnly(row.date) },
    { key: 'materialName', label: 'Material' },
    { key: 'quantity', label: 'Quantity', render: (row) => `${row.quantity} ${row.unit}` },
    { key: 'ratePerUnit', label: 'Rate', render: (row) => rupee(row.ratePerUnit) },
    { key: 'supplier', label: 'Vendor', render: (row) => getName(row.supplier, row.supplierNameSnapshot || '-') },
    { key: 'totalAmount', label: 'Total', render: (row) => rupee(row.totalAmount) },
    { key: 'pendingAmount', label: 'Pending', render: (row) => rupee(row.pendingAmount) }
  ];
  const clientPaymentColumns = [
    { key: 'date', label: 'Date', render: (row) => dateOnly(row.date) },
    { key: 'client', label: 'Client', render: (row) => getName(row.client, row.clientNameSnapshot || project.clientNameSnapshot || '-') },
    { key: 'amountReceived', label: 'Amount Received', render: (row) => rupee(row.amountReceived) },
    { key: 'paymentMode', label: 'Payment Mode' },
    { key: 'referenceNumber', label: 'Reference' },
    { key: 'notes', label: 'Notes' }
  ];
  const transactionColumns = [
    { key: 'date', label: 'Date', render: (row) => dateOnly(row.date) },
    { key: 'transactionType', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'moneyIn', label: 'Money In', render: (row) => row.moneyIn ? rupee(row.moneyIn) : '-' },
    { key: 'moneyOut', label: 'Money Out', render: (row) => row.moneyOut ? rupee(row.moneyOut) : '-' },
    { key: 'paymentMode', label: 'Mode' }
  ];

  return (
    <div className="page site-workspace">
      <div className="site-workspace-head">
        <Link to="/sites" className="icon-btn" title="Back to sites"><ArrowLeft size={19} /></Link>
        <div className="site-title">
          <div><h1>{project.projectName}</h1><p>{project.siteLocation} | {getName(project.client, project.clientNameSnapshot || '-')}</p></div>
          <span className={`site-status ${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</span>
        </div>
      </div>
      {message && <div className="alert">{message}</div>}
      <nav className="workspace-tabs">
        {tabs.map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}
      </nav>

      {tab === 'overview' && (
        <>
          <div className="quick-actions">
            <button onClick={() => setAction({ date: new Date().toISOString().slice(0, 10), attendance: 'Full Day' })}><ClipboardCheck size={21} /><span><strong>Mark Attendance</strong><small>Add today's labour</small></span></button>
            <button onClick={() => setPurchase({ date: new Date().toISOString().slice(0, 10), paymentMode: 'Cash', quantity: 1, paidAmount: 0 })}><PackagePlus size={21} /><span><strong>Buy Material</strong><small>Rate auto-fills</small></span></button>
            <button onClick={() => setTab('payments')}><CreditCard size={21} /><span><strong>Pay Labour</strong><small>{payments.filter((item) => item.status === 'UNPAID').length} dues pending</small></span></button>
            <button onClick={() => setClientPayment({ date: new Date().toISOString().slice(0, 10), paymentMode: 'Bank Transfer', amountReceived: 0 })}><IndianRupee size={21} /><span><strong>Receive Payment</strong><small>{rupee(totals.pendingClientAmount)} pending</small></span></button>
          </div>
          <div className="stat-grid">
            <StatCard label="Contract Amount" value={totals.contractAmount} />
            <StatCard label="Client Received" value={totals.totalReceived} tone="good" />
            <StatCard label="Total Expenditure" value={totals.totalExpenditure} tone="bad" />
            <StatCard label="Expected Profit/Loss" value={totals.expectedProfit} tone={totals.expectedProfit >= 0 ? 'good' : 'bad'} />
            <StatCard label="Material Cost" value={totals.materialCost} tone="bad" />
            <StatCard label="Labour Cost" value={totals.labourAttendanceCost} tone="bad" />
            <StatCard label="Pending Labour" value={totals.pendingLabourPayment} tone="pending" />
            <StatCard label="Pending From Client" value={totals.pendingClientAmount} tone="pending" />
          </div>
          <div className="chart-grid two"><ExpensePie data={charts.expenseBreakdown} /><MonthlyChart data={charts.monthlyExpense} /></div>
          <DataTable title="Recent Site Transactions" rows={registers.transactions.slice(0, 8)} columns={transactionColumns} />
        </>
      )}

      {tab === 'attendance' && <DataTable title="Labour Attendance" rows={attendance} columns={attendanceColumns} actions={<button className="primary-btn" onClick={() => setAction({ date: new Date().toISOString().slice(0, 10), attendance: 'Full Day' })}><Plus size={17} /> Mark Attendance</button>} />}
      {tab === 'payments' && <DataTable title="Labour Payment Status" rows={payments} columns={paymentColumns} actions={<button className="primary-btn" disabled={!selectedDues.length} onClick={() => payDues(selectedDues)}>Pay Selected</button>} />}
      {tab === 'materials' && <DataTable title="Material Purchases" rows={purchases} columns={purchaseColumns} actions={<button className="primary-btn" onClick={() => setPurchase({ date: new Date().toISOString().slice(0, 10), paymentMode: 'Cash', quantity: 1, paidAmount: 0 })}><Plus size={17} /> Add Purchase</button>} />}
      {tab === 'client-payments' && <DataTable title="Client Received Amount History" rows={clientPayments} columns={clientPaymentColumns} actions={<button className="primary-btn" onClick={() => setClientPayment({ date: new Date().toISOString().slice(0, 10), paymentMode: 'Bank Transfer', amountReceived: 0 })}><Plus size={17} /> Receive Payment</button>} />}
      {tab === 'register' && <DataTable title="Full Site Register" rows={registers.transactions} columns={transactionColumns} />}

      {action && <FormModal title="Mark Labour Attendance" fields={attendanceFields} value={action} setValue={setAction} onSubmit={saveAttendance} onClose={() => setAction(null)} />}
      {purchase && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={savePurchase}>
            <div className="modal-head"><h2>Add Material Purchase</h2><button type="button" className="ghost-btn" onClick={() => setPurchase(null)}>Cancel</button></div>
            <div className="form-grid">
              <label><span>Date</span><input type="date" value={purchase.date} onChange={(e) => setPurchase({ ...purchase, date: e.target.value })} required /></label>
              <label><span>Material</span><select value={purchase.material || ''} onChange={(e) => chooseMaterial(e.target.value)} required><option value="">Select material</option>{materials.map((item) => <option key={item._id} value={item._id}>{item.materialName}</option>)}</select></label>
              <label><span>Quantity</span><input type="number" min="0" value={purchase.quantity} onChange={(e) => setPurchase({ ...purchase, quantity: Number(e.target.value) })} required /></label>
              <label><span>Unit</span><input value={purchase.unit || ''} onChange={(e) => setPurchase({ ...purchase, unit: e.target.value })} required /></label>
              <label><span>Rate Per Unit</span><input type="number" min="0" value={purchase.ratePerUnit || ''} onChange={(e) => setPurchase({ ...purchase, ratePerUnit: Number(e.target.value) })} required /></label>
              <label><span>Calculated Total</span><input value={rupee((purchase.quantity || 0) * (purchase.ratePerUnit || 0))} readOnly /></label>
              <label><span>Material Vendor</span><select value={purchase.supplier || ''} onChange={(e) => setPurchase({ ...purchase, supplier: e.target.value })} required><option value="">Select vendor</option>{suppliers.map((item) => <option key={item._id} value={item._id}>{item.supplierName}</option>)}</select></label>
              <label><span>Payment Mode</span><select value={purchase.paymentMode} onChange={(e) => setPurchase({ ...purchase, paymentMode: e.target.value })}>{paymentModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
              <label><span>Paid Amount</span><input type="number" min="0" value={purchase.paidAmount} onChange={(e) => setPurchase({ ...purchase, paidAmount: Number(e.target.value) })} /></label>
              <label><span>Invoice Number</span><input value={purchase.billInvoiceNumber || ''} onChange={(e) => setPurchase({ ...purchase, billInvoiceNumber: e.target.value })} /></label>
              <label className="wide"><span>Notes</span><textarea value={purchase.notes || ''} onChange={(e) => setPurchase({ ...purchase, notes: e.target.value })} /></label>
            </div>
            <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setPurchase(null)}>Cancel</button><button className="primary-btn">Save Purchase</button></div>
          </form>
        </div>
      )}
      {clientPayment && (
        <div className="modal-backdrop">
          <form className="modal payment-modal" onSubmit={saveClientPayment}>
            <div className="modal-head">
              <div>
                <h2>Receive Client Payment</h2>
                <p>{getName(project.client, project.clientNameSnapshot || 'Site client')}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setClientPayment(null)} title="Close"><X size={18} /></button>
            </div>
            <div className="payment-context">
              <span>Contract <strong>{rupee(totals.contractAmount)}</strong></span>
              <span>Received <strong>{rupee(totals.totalReceived)}</strong></span>
              <span>Pending <strong>{rupee(totals.pendingClientAmount)}</strong></span>
            </div>
            <div className="form-grid">
              <label><span>Date</span><input type="date" value={clientPayment.date} onChange={(e) => setClientPayment({ ...clientPayment, date: e.target.value })} required /></label>
              <label><span>Amount Received</span><input type="number" min="1" value={clientPayment.amountReceived || ''} onChange={(e) => setClientPayment({ ...clientPayment, amountReceived: Number(e.target.value) })} required /></label>
              <label><span>Payment Mode</span><select value={clientPayment.paymentMode} onChange={(e) => setClientPayment({ ...clientPayment, paymentMode: e.target.value })}>{paymentModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
              <label><span>Reference Number</span><input value={clientPayment.referenceNumber || ''} onChange={(e) => setClientPayment({ ...clientPayment, referenceNumber: e.target.value })} /></label>
              <label className="wide"><span>Notes</span><textarea value={clientPayment.notes || ''} onChange={(e) => setClientPayment({ ...clientPayment, notes: e.target.value })} /></label>
            </div>
            <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setClientPayment(null)}>Cancel</button><button className="primary-btn">Save Received Amount</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
