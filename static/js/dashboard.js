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
  lessons.forEach((lesson) => {
    const row = document.createElement('tr');
    const startTime = lesson.start_time?.substring(0, 5) || '';
    const endTime = lesson.end_time?.substring(0, 5) || '';
    const players = (lesson.players || []).map((p) => p.full_name).join(', ');
    row.innerHTML = `
      <td>${lesson.date}</td>
      <td>${startTime} - ${endTime}</td>
      <td>${players}</td>
      <td><span class="badge bg-secondary text-uppercase">${lesson.status}</span></td>
      <td><a class="btn btn-sm btn-outline-primary" href="/lessons/${lesson.id}/edit">Open</a></td>
    `;
    tbody.appendChild(row);
  });
}

if (document.getElementById('upcomingLessonsTable')) {
  loadDashboard();
}
