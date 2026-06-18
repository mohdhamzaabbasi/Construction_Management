import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportCSV(filename, rows, columns) {
  const header = columns.map((c) => c.label).join(',');
  const body = rows.map((row) =>
    columns.map((c) => `"${String(c.render ? c.render(row) : row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(title, rows, columns) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.text(title, 14, 14);
  autoTable(doc, {
    startY: 20,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => String(c.render ? c.render(row) : row[c.key] ?? '')))
  });
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
