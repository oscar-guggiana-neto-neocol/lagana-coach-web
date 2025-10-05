import { apiRequest } from './api.js';

const STORAGE_KEY = 'laganacoach.invoiceWizard';
const step = window.INVOICE_WIZARD_STEP;

if (step === 'period') {
  const form = document.getElementById('invoicePeriodForm');
  const alertBox = document.getElementById('invoicePeriodAlert');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (alertBox) alertBox.classList.add('d-none');
      const periodStart = document.getElementById('period_start').value;
      const periodEnd = document.getElementById('period_end').value;
      try {
        const data = await apiRequest('/invoices/generate/prepare', {
          method: 'POST',
          body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
        });
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ periodStart, periodEnd, data }));
        window.location.href = '/invoices/wizard/select';
      } catch (err) {
        if (alertBox) {
          alertBox.textContent = err.message || 'Unable to prepare invoice';
          alertBox.className = 'alert alert-danger';
          alertBox.classList.remove('d-none');
        }
      }
    });
  }
}

if (step === 'select') {
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  const tableBody = document.querySelector('#wizardLessonsTable tbody');
  const grossEl = document.getElementById('totalGross');
  const reimbursementEl = document.getElementById('totalReimbursement');
  const netEl = document.getElementById('totalNet');
  const alertBox = document.getElementById('invoiceWizardAlert');
  const form = document.getElementById('invoiceConfirmForm');

  if (!stored) {
    window.location.href = '/invoices/wizard/period';
  } else {
    const payload = JSON.parse(stored);
    const lessons = payload.data.lessons || [];
    const totals = payload.data;

    if (grossEl) grossEl.textContent = `£${Number(totals.total_gross).toFixed(2)}`;
    if (reimbursementEl) reimbursementEl.textContent = `£${Number(totals.total_club_reimbursement).toFixed(2)}`;
    if (netEl) netEl.textContent = `£${Number(totals.total_net).toFixed(2)}`;

    if (tableBody) {
      tableBody.innerHTML = '';
      lessons.forEach((item) => {
        const lesson = item.lesson;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input class="form-check-input" type="checkbox" checked value="${lesson.id}"></td>
          <td>${lesson.date}</td>
          <td>${(lesson.players || []).map((p) => p.full_name).join(', ')}</td>
          <td>£${Number(item.amount).toFixed(2)}</td>
          <td>£${Number(item.club_reimbursement).toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
      });
    }

    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (alertBox) alertBox.classList.add('d-none');
        const dueDate = document.getElementById('due_date').value || null;
        const selectedLessonIds = Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((input) => parseInt(input.value, 10));
        if (!selectedLessonIds.length) {
          if (alertBox) {
            alertBox.textContent = 'Select at least one lesson.';
            alertBox.className = 'alert alert-warning';
            alertBox.classList.remove('d-none');
          }
          return;
        }
        try {
          const invoice = await apiRequest('/invoices/generate/confirm', {
            method: 'POST',
            body: JSON.stringify({
              period_start: payload.periodStart,
              period_end: payload.periodEnd,
              lesson_ids: selectedLessonIds,
              due_date: dueDate,
            }),
          });
          window.sessionStorage.removeItem(STORAGE_KEY);
          window.location.href = `/invoices/${invoice.id}`;
        } catch (err) {
          if (alertBox) {
            alertBox.textContent = err.message || 'Unable to create invoice';
            alertBox.className = 'alert alert-danger';
            alertBox.classList.remove('d-none');
          }
        }
      });
    }
  }
}
