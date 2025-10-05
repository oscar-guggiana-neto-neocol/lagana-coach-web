import { apiRequest } from './api.js';

const invoiceId = window.INVOICE_ID;
const summaryContainer = document.getElementById('invoiceSummary');
const itemsTable = document.querySelector('#invoiceItemsTable tbody');
const downloadButton = document.getElementById('downloadPdf');

async function loadInvoice() {
  if (!invoiceId) return;
  try {
    const invoice = await apiRequest(`/invoices/${invoiceId}`);
    renderSummary(invoice);
    renderItems(invoice.items || []);
    if (downloadButton && invoice.pdf_url) {
      downloadButton.addEventListener('click', () => {
        window.open(invoice.pdf_url, '_blank');
      });
    }
  } catch (err) {
    console.error('Failed to load invoice', err);
  }
}

function renderSummary(invoice) {
  if (!summaryContainer) return;
  summaryContainer.innerHTML = `
    <div class="col-12 col-md-4">
      <div class="card"><div class="card-body">
        <h6 class="text-muted">Period</h6>
        <p class="fw-bold mb-0">${invoice.period_start} → ${invoice.period_end}</p>
      </div></div>
    </div>
    <div class="col-12 col-md-4">
      <div class="card"><div class="card-body">
        <h6 class="text-muted">Totals</h6>
        <p class="mb-0">Gross: £${Number(invoice.total_gross).toFixed(2)}</p>
        <p class="mb-0">Club reimbursement: £${Number(invoice.total_club_reimbursement).toFixed(2)}</p>
        <p class="fw-bold">Net: £${Number(invoice.total_net).toFixed(2)}</p>
      </div></div>
    </div>
    <div class="col-12 col-md-4">
      <div class="card"><div class="card-body">
        <h6 class="text-muted">Status</h6>
        <p class="badge bg-secondary text-uppercase">${invoice.status}</p>
        ${invoice.pdf_url ? `<p class="mt-2"><a href="${invoice.pdf_url}" target="_blank">Open PDF</a></p>` : ''}
      </div></div>
    </div>
  `;
}

function renderItems(items) {
  if (!itemsTable) return;
  itemsTable.innerHTML = '';
  items.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.description}</td>
      <td>£${Number(item.amount).toFixed(2)}</td>
    `;
    itemsTable.appendChild(row);
  });
}

if (invoiceId) {
  loadInvoice();
}
