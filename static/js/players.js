import { apiRequest } from './api.js';

const playersTable = document.querySelector('#playersTable tbody');
const searchInput = document.getElementById('playerSearch');
let currentSearch = '';

async function loadPlayers() {
  if (!playersTable) return;
  const params = new URLSearchParams({ page: '1', size: '50' });
  if (currentSearch) params.set('search', currentSearch);
  try {
    const data = await apiRequest(`/players?${params.toString()}`);
    playersTable.innerHTML = '';
    (data.items || []).forEach((player) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${player.full_name}</td>
        <td>${player.email || ''}</td>
        <td><span class="badge bg-secondary text-uppercase">${player.skill_level}</span></td>
        <td>${player.active ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-light text-muted">Inactive</span>'}</td>
        <td><a class="btn btn-outline-primary btn-sm" href="/players/${player.id}/edit">Edit</a></td>
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
