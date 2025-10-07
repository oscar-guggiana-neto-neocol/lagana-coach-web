import { apiRequest } from './api.js';

const invoicesTable = document.querySelector('#invoicesTable tbody');
const invoicesTableElement = document.getElementById('invoicesTable');
const invoicesEmpty = document.getElementById('invoicesEmpty');

const statusClasses = {
  draft: 'status-draft',
  issued: 'status-issued',
  paid: 'status-paid',
  void: 'status-void',
};

function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return `£${amount.toFixed(2)}`;
}

async function loadInvoices() {
  if (!invoicesTable) return;
  try {
    const data = await apiRequest('/invoices?page=1&size=50');
    invoicesTable.innerHTML = '';
    const invoices = data.items || [];

    if (!invoices.length) {
      invoicesTableElement?.classList.add('d-none');
      if (invoicesEmpty) invoicesEmpty.classList.remove('d-none');
      return;
    }

    invoicesTableElement?.classList.remove('d-none');
    if (invoicesEmpty) invoicesEmpty.classList.add('d-none');

    invoices.forEach((invoice) => {
      const row = document.createElement('tr');
      const statusKey = (invoice.status || '').toLowerCase();
      const statusClass = statusClasses[statusKey] || 'status-issued';
      const statusLabel = (invoice.status || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

      row.innerHTML = `
        <td class="fw-semibold">#${invoice.id}</td>
        <td>
          <div>${invoice.period_start}</div>
          <div class="text-muted small">to ${invoice.period_end}</div>
        </td>
        <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
        <td>${formatCurrency(invoice.total_net)}</td>
        <td class="text-end"><a class="btn btn-sm btn-outline-primary" href="/invoices/${invoice.id}">View</a></td>
      `;
      invoicesTable.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load invoices', err);
  }
}

if (invoicesTable) {
  loadInvoices();
}
