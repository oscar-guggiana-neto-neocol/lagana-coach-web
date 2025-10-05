import { apiRequest } from './api.js';

const lessonsTable = document.querySelector('#lessonsTable tbody');
const filtersForm = document.getElementById('lessonFilters');

async function loadLessons() {
  if (!lessonsTable) return;
  const params = new URLSearchParams({ page: '1', size: '50' });
  if (filtersForm) {
    const dateFrom = filtersForm.querySelector('#date_from').value;
    const dateTo = filtersForm.querySelector('#date_to').value;
    const status = filtersForm.querySelector('#status').value;
    const paymentStatus = filtersForm.querySelector('#payment_status').value;
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (status) params.set('status', status);
    if (paymentStatus) params.set('payment_status', paymentStatus);
  }
  try {
    const data = await apiRequest(`/lessons?${params.toString()}`);
    lessonsTable.innerHTML = '';
    (data.items || []).forEach((lesson) => {
      const row = document.createElement('tr');
      const players = (lesson.players || []).map((p) => p.full_name).join(', ');
      row.innerHTML = `
        <td>${lesson.date}</td>
        <td>${lesson.start_time?.substring(0, 5) || ''} - ${lesson.end_time?.substring(0, 5) || ''}</td>
        <td>${players}</td>
        <td><span class="badge bg-secondary text-uppercase">${lesson.status}</span></td>
        <td>£${Number(lesson.total_amount).toFixed(2)}</td>
        <td><a class="btn btn-sm btn-outline-primary" href="/lessons/${lesson.id}/edit">Edit</a></td>
      `;
      lessonsTable.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load lessons', err);
  }
}

if (filtersForm) {
  filtersForm.addEventListener('change', () => loadLessons());
}

if (lessonsTable) {
  loadLessons();
}
