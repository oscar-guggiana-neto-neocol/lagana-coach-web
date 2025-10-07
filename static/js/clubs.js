import { apiRequest } from './api.js';

const tableBody = document.querySelector('#clubsTable tbody');
const tableElement = document.getElementById('clubsTable');
const emptyPlaceholder = document.getElementById('clubsEmpty');
const searchInput = document.getElementById('clubSearch');

let currentSearch = '';
let clubsCache = [];

function matchesSearch(club, term) {
  if (!term) return true;
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return [club.name, club.city, club.email, club.phone]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalized));
}

function renderClubs(clubs) {
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (!clubs.length) {
    tableElement?.classList.add('d-none');
    emptyPlaceholder?.classList.remove('d-none');
    return;
  }

  tableElement?.classList.remove('d-none');
  emptyPlaceholder?.classList.add('d-none');

  clubs
    .filter((club) => matchesSearch(club, currentSearch))
    .forEach((club) => {
    const row = document.createElement('tr');
    const locationParts = [club.city, club.country].filter(Boolean);
    const contactParts = [club.email || null, club.phone || null].filter(Boolean);
    const courtsCount = club.courts ? club.courts.length : 0;

    row.innerHTML = `
      <td class="fw-semibold">${club.name}</td>
      <td>${locationParts.length ? locationParts.join(', ') : '<span class="text-muted">—</span>'}</td>
      <td>${contactParts.length ? contactParts.join('<br>') : '<span class="text-muted">—</span>'}</td>
      <td><span class="badge-pill badge-pill-info">${courtsCount} court${courtsCount === 1 ? '' : 's'}</span></td>
      <td class="text-end"><a class="btn btn-outline-primary btn-sm" href="/clubs/${club.id}/edit">Edit</a></td>
    `;
      tableBody.appendChild(row);
    });

  if (!tableBody.children.length) {
    tableElement?.classList.add('d-none');
    emptyPlaceholder?.classList.remove('d-none');
  }
}

async function loadClubs() {
  if (!tableBody) return;
  try {
    const data = await apiRequest('/clubs?page=1&size=200');
    clubsCache = data.items || [];
    renderClubs(clubsCache);
  } catch (err) {
    console.error('Failed to load clubs', err);
  }
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    currentSearch = event.target.value;
    renderClubs(clubsCache);
  });
}

if (tableBody) {
  loadClubs();
}
