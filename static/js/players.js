import { apiRequest } from './api.js';

const playersTable = document.querySelector('#playersTable tbody');
const playersTableElement = document.getElementById('playersTable');
const emptyPlaceholder = document.getElementById('playersEmpty');
const searchInput = document.getElementById('playerSearch');
let currentSearch = '';

function formatLabel(value) {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

async function loadPlayers() {
  if (!playersTable) return;
  const params = new URLSearchParams({ page: '1', size: '50' });
  if (currentSearch) params.set('search', currentSearch);
  try {
    const data = await apiRequest(`/players?${params.toString()}`);
    playersTable.innerHTML = '';
    const players = data.items || [];

    if (!players.length) {
      playersTableElement?.classList.add('d-none');
      if (emptyPlaceholder) emptyPlaceholder.classList.remove('d-none');
      return;
    }

    playersTableElement?.classList.remove('d-none');
    if (emptyPlaceholder) emptyPlaceholder.classList.add('d-none');

    players.forEach((player) => {
      const row = document.createElement('tr');
      const skillKey = player.skill_level || 'unassigned';
      const skillLevel = player.skill_level ? formatLabel(player.skill_level) : 'Unassigned';
      const skillClass = `badge-pill badge-pill-${skillKey}`;
      const statusClass = player.active ? 'status-active' : 'status-inactive';
      const statusLabel = player.active ? 'Active' : 'Inactive';
      const phoneLine = player.phone ? `<div class="text-muted small">${player.phone}</div>` : '';

      row.innerHTML = `
        <td>
          <div class="fw-semibold">${player.full_name}</div>
          ${phoneLine}
        </td>
        <td>${player.email || '<span class="text-muted">—</span>'}</td>
        <td><span class="${skillClass}">${skillLevel}</span></td>
        <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
        <td class="text-end"><a class="btn btn-outline-primary btn-sm" href="/players/${player.id}/edit">Edit</a></td>
      `;
      playersTable.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load players', err);
  }
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    currentSearch = event.target.value;
    loadPlayers();
  });
}

if (playersTable) {
  loadPlayers();
}
