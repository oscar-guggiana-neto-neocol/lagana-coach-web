import { apiRequest } from './api.js';

const invoicesTable = document.querySelector('#invoicesTable tbody');

async function loadInvoices() {
  if (!invoicesTable) return;
  try {
    const data = await apiRequest('/invoices?page=1&size=50');
    invoicesTable.innerHTML = '';
    (data.items || []).forEach((invoice) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#${invoice.id}</td>
        <td>${invoice.period_start} → ${invoice.period_end}</td>
        <td><span class="badge bg-secondary text-uppercase">${invoice.status}</span></td>
        <td>£${Number(invoice.total_net).toFixed(2)}</td>
        <td><a class="btn btn-sm btn-outline-primary" href="/invoices/${invoice.id}">View</a></td>
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
