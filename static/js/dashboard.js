import { apiRequest, redirectToLogin } from './api.js';

async function loadDashboard() {
  try {
    const players = await apiRequest('/players?page=1&size=1');
    document.getElementById('kpiPlayers').textContent = players.total ?? players.items.length;
  } catch (err) {
    console.error('Failed to load players', err);
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const lessons = await apiRequest(`/lessons?page=1&size=5&date_from=${today}`);
    document.getElementById('kpiLessons').textContent = lessons.total ?? lessons.items.length;
    renderUpcomingLessons(lessons.items || []);
  } catch (err) {
    console.error('Failed to load lessons', err);
  }

  try {
    const invoices = await apiRequest('/invoices?page=1&size=5&status_filter=issued');
    document.getElementById('kpiInvoices').textContent = invoices.total ?? invoices.items.length;
  } catch (err) {
    console.error('Failed to load invoices', err);
  }
}

function renderUpcomingLessons(lessons) {
  const tbody = document.querySelector('#upcomingLessonsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const statusClasses = {
    draft: 'status-draft',
    set: 'status-set',
    executed: 'status-executed',
    invoiced: 'status-invoiced',
  };

  if (!lessons.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="5" class="text-center text-muted py-4">No upcoming lessons. Enjoy the day or <a href="/lessons/new" class="link-accent">schedule one now</a>.</td>`;
    tbody.appendChild(emptyRow);
    return;
  }

  lessons.forEach((lesson) => {
    const row = document.createElement('tr');
    const startTime = lesson.start_time?.substring(0, 5) || '';
    const endTime = lesson.end_time?.substring(0, 5) || '';
    const players = (lesson.players || []).map((p) => p.full_name).join(', ');
    const statusClass = statusClasses[lesson.status] || 'status-draft';
    const statusLabel = (lesson.status || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    row.innerHTML = `
      <td>${lesson.date}</td>
      <td>${startTime} - ${endTime}</td>
      <td>${players}</td>
      <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
      <td><a class="btn btn-sm btn-outline-primary" href="/lessons/${lesson.id}/edit">Open</a></td>
    `;
    tbody.appendChild(row);
  });
}

if (document.getElementById('upcomingLessonsTable')) {
  loadDashboard();
}
