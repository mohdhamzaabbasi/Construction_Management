export const rupee = (value = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));

export const dateOnly = (value) => (value ? new Date(value).toLocaleDateString('en-IN') : '-');
export const inputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export function getName(value, fallback = '-') {
  if (!value) return fallback;
  return value.projectName || value.clientName || value.supplierName || value.labourName || value.name || fallback;
}
