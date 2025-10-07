import { apiRequest } from './api.js';

const lessonsTable = document.querySelector('#lessonsTable tbody');
const lessonsTableElement = document.getElementById('lessonsTable');
const filtersForm = document.getElementById('lessonFilters');
const sortableHeaders = document.querySelectorAll('#lessonsTable thead th[data-sort-key]');
const lessonsEmpty = document.getElementById('lessonsEmpty');

const statusClasses = {
  draft: 'status-draft',
  set: 'status-set',
  executed: 'status-executed',
  invoiced: 'status-invoiced',
};

let lessonsData = [];
let currentSort = { key: 'date', direction: 'asc' };

function parseTimeToMinutes(timeString) {
  if (!timeString) return Number.POSITIVE_INFINITY;
  const [hours, minutes] = timeString.split(':').map((value) => parseInt(value, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.NEGATIVE_INFINITY;
  return hours * 60 + minutes;
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return `£${amount.toFixed(2)}`;
}

function formatLabel(text) {
  if (!text) return '';
  return text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getPlayersLabel(lesson) {
  return (lesson.players || []).map((player) => player.full_name).join(', ');
}

function getSortValue(lesson, sortKey) {
  switch (sortKey) {
    case 'date':
      return Date.parse(lesson.date || '') || 0;
    case 'time':
      return parseTimeToMinutes(lesson.start_time);
    case 'type':
      return (lesson.type || '').toLowerCase();
    case 'players':
      return getPlayersLabel(lesson).toLowerCase();
    case 'status':
      return (lesson.status || '').toLowerCase();
    case 'total_amount':
      return Number(lesson.total_amount ?? 0);
    default:
      return '';
  }
}

function updateSortIndicators() {
  sortableHeaders.forEach((header) => {
    const key = header.dataset.sortKey;
    const isActive = currentSort.key === key;
    header.setAttribute('aria-sort', isActive ? currentSort.direction : 'none');
    header.classList.toggle('sorted', isActive);
    header.classList.toggle('sorted-desc', isActive && currentSort.direction === 'desc');
    header.classList.toggle('sorted-asc', isActive && currentSort.direction === 'asc');
  });
}

function renderLessons() {
  if (!lessonsTable) return;
  const sortedData = [...lessonsData].sort((a, b) => {
    const valueA = getSortValue(a, currentSort.key);
    const valueB = getSortValue(b, currentSort.key);
    if (valueA === valueB) return 0;
    if (valueA === undefined || valueA === null) return 1;
    if (valueB === undefined || valueB === null) return -1;

    if (typeof valueA === 'string' || typeof valueB === 'string') {
      return currentSort.direction === 'asc'
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    }

    return currentSort.direction === 'asc' ? valueA - valueB : valueB - valueA;
  });

  if (!sortedData.length) {
    lessonsTable.innerHTML = '';
    lessonsTableElement?.classList.add('d-none');
    if (lessonsEmpty) lessonsEmpty.classList.remove('d-none');
    updateSortIndicators();
    return;
  }

  lessonsTableElement?.classList.remove('d-none');
  if (lessonsEmpty) lessonsEmpty.classList.add('d-none');

  lessonsTable.innerHTML = '';
  sortedData.forEach((lesson) => {
    const row = document.createElement('tr');
    const players = getPlayersLabel(lesson);
    const startTime = lesson.start_time ? lesson.start_time.substring(0, 5) : '';
    const endTime = lesson.end_time ? lesson.end_time.substring(0, 5) : '';
    const statusClass = statusClasses[lesson.status] || 'status-draft';
    row.innerHTML = `
      <td>${lesson.date || ''}</td>
      <td>${startTime} - ${endTime}</td>
      <td>${formatLabel(lesson.type)}</td>
      <td>${players}</td>
      <td><span class="badge-status ${statusClass}">${formatLabel(lesson.status)}</span></td>
      <td>${formatCurrency(lesson.total_amount)}</td>
      <td class="text-end"><a class="btn btn-sm btn-outline-primary" href="/lessons/${lesson.id}/edit">Edit</a></td>
    `;
    lessonsTable.appendChild(row);
  });

  updateSortIndicators();
}

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
    lessonsData = data.items || [];
    renderLessons();
  } catch (err) {
    console.error('Failed to load lessons', err);
  }
}

function handleSortClick(event) {
  const header = event.currentTarget;
  const { sortKey } = header.dataset;
  if (!sortKey) return;

  if (currentSort.key === sortKey) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort = { key: sortKey, direction: 'asc' };
  }
  renderLessons();
}

if (sortableHeaders.length) {
  sortableHeaders.forEach((header) => {
    header.tabIndex = 0;
    header.setAttribute('role', 'button');
    header.addEventListener('click', handleSortClick);
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSortClick(event);
      }
    });
  });
}

if (filtersForm) {
  filtersForm.addEventListener('change', () => loadLessons());
}

if (lessonsTable) {
  loadLessons();
}
