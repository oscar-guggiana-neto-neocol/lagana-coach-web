import { apiRequest } from './api.js';

const form = document.getElementById('clubForm');
if (form) {
  const mode = form.dataset.mode;
  const clubId = form.dataset.clubId;
  const alertBox = document.getElementById('clubFormAlert');
  const courtsSection = document.getElementById('courtsSection');
  const courtsTableBody = document.querySelector('#courtsTable tbody');
  const courtsTableElement = document.getElementById('courtsTable');
  const courtsEmpty = document.getElementById('courtsEmpty');
  const courtForm = document.getElementById('courtForm');
  let courts = [];

  function showAlert(message, type = 'danger') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('d-none');
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.classList.add('d-none');
  }

  function readInput(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  function collectFormData() {
    return {
      name: readInput('name'),
      email: readInput('email') || null,
      phone: readInput('phone') || null,
      address_line1: readInput('address_line1') || null,
      address_line2: readInput('address_line2') || null,
      city: readInput('city') || null,
      postcode: readInput('postcode') || null,
      country: readInput('country') || null,
    };
  }

  function formatStatus(active) {
    return active
      ? '<span class="badge-status status-active">Active</span>'
      : '<span class="badge-status status-inactive">Inactive</span>';
  }

  function renderCourts() {
    if (!courtsTableBody) return;
    courtsTableBody.innerHTML = '';

    if (!courts.length) {
      courtsTableElement?.classList.add('d-none');
      courtsEmpty?.classList.remove('d-none');
      return;
    }

    courtsTableElement?.classList.remove('d-none');
    courtsEmpty?.classList.add('d-none');

    courts.forEach((court) => {
      const row = document.createElement('tr');
      row.dataset.courtId = court.id;
      row.innerHTML = `
        <td class="fw-semibold">${court.name}</td>
        <td>${formatStatus(court.active)}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary" data-action="rename">Rename</button>
            <button class="btn btn-outline-primary" data-action="toggle">${court.active ? 'Disable' : 'Activate'}</button>
            <button class="btn btn-outline-primary" data-action="delete">Delete</button>
          </div>
        </td>
      `;
      courtsTableBody.appendChild(row);
    });
  }

  async function loadClubDetails() {
    if (!clubId) return;
    try {
      const club = await apiRequest(`/clubs/${clubId}`);
      document.getElementById('name').value = club.name;
      document.getElementById('email').value = club.email || '';
      document.getElementById('phone').value = club.phone || '';
      document.getElementById('address_line1').value = club.address_line1 || '';
      document.getElementById('address_line2').value = club.address_line2 || '';
      document.getElementById('city').value = club.city || '';
      document.getElementById('postcode').value = club.postcode || '';
      document.getElementById('country').value = club.country || '';
      courts = club.courts || [];
      renderCourts();
    } catch (err) {
      showAlert(err.message || 'Unable to load club');
    }
  }

  async function saveClub(event) {
    event.preventDefault();
    hideAlert();
    const payload = collectFormData();
    if (!payload.name) {
      showAlert('Name is required');
      return;
    }
    try {
      if (mode === 'create') {
        await apiRequest('/clubs', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else if (clubId) {
        await apiRequest(`/clubs/${clubId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      window.location.href = '/clubs';
    } catch (err) {
      showAlert(err.message || 'Unable to save club');
    }
  }

  async function handleCourtCreate(event) {
    event.preventDefault();
    if (!clubId) return;
    const nameInput = document.getElementById('courtName');
    const activeInput = document.getElementById('courtActive');
    const name = nameInput.value.trim();
    if (!name) {
      showAlert('Court name is required');
      return;
    }
    hideAlert();
    try {
      const court = await apiRequest(`/clubs/${clubId}/courts`, {
        method: 'POST',
        body: JSON.stringify({ name, active: activeInput.checked }),
      });
      courts.push(court);
      renderCourts();
      nameInput.value = '';
      activeInput.checked = true;
    } catch (err) {
      showAlert(err.message || 'Unable to add court');
    }
  }

  async function handleCourtAction(event) {
    if (!clubId) return;
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const row = button.closest('tr');
    const courtId = row?.dataset.courtId;
    if (!courtId) return;
    const action = button.dataset.action;
    const court = courts.find((item) => String(item.id) === courtId);
    if (!court) return;

    hideAlert();

    try {
      if (action === 'rename') {
        const newName = window.prompt('Rename court', court.name);
        if (!newName || newName.trim() === '' || newName === court.name) return;
        const updated = await apiRequest(`/clubs/${clubId}/courts/${court.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: newName.trim() }),
        });
        Object.assign(court, updated);
      } else if (action === 'toggle') {
        const updated = await apiRequest(`/clubs/${clubId}/courts/${court.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ active: !court.active }),
        });
        Object.assign(court, updated);
      } else if (action === 'delete') {
        const confirmDelete = window.confirm(`Delete court "${court.name}"?`);
        if (!confirmDelete) return;
        await apiRequest(`/clubs/${clubId}/courts/${court.id}`, {
          method: 'DELETE',
        });
        courts = courts.filter((item) => item.id !== court.id);
      }
      renderCourts();
    } catch (err) {
      showAlert(err.message || 'Unable to update court');
    }
  }

  form.addEventListener('submit', saveClub);

  if (mode === 'edit' && clubId) {
    loadClubDetails();
    courtsTableBody?.addEventListener('click', handleCourtAction);
    courtForm?.addEventListener('submit', handleCourtCreate);
  }
}
