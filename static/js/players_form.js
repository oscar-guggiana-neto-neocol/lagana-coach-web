import { apiRequest, getCurrentUser } from './api.js';

const form = document.getElementById('playerForm');
if (!form) {
  // nothing to do
} else {
  const mode = form.dataset.mode;
  const playerId = form.dataset.playerId;
  const alertBox = document.getElementById('playerFormAlert');
  const coachSelect = document.getElementById('coach_ids');

  init();

  async function init() {
    try {
      await populateCoaches();
      if (mode === 'edit' && playerId) {
        await loadPlayer(playerId);
      }
    } catch (err) {
      showAlert(err.message || 'Unable to load form data', 'danger');
    }
  }

  async function populateCoaches() {
    const user = await getCurrentUser();
    coachSelect.innerHTML = '';

    if (user.role === 'coach') {
      const coach = await apiRequest('/coaches/me');
      const option = document.createElement('option');
      option.value = coach.id;
      option.textContent = coach.full_name;
      option.selected = true;
      coachSelect.appendChild(option);
      coachSelect.disabled = true;
    } else {
      const coaches = await apiRequest('/coaches?page=1&size=100');
      (coaches.items || []).forEach((coach) => {
        const option = document.createElement('option');
        option.value = coach.id;
        option.textContent = coach.full_name;
        coachSelect.appendChild(option);
      });
    }
  }

  async function loadPlayer(id) {
    const player = await apiRequest(`/players/${id}`);
    form.querySelector('#full_name').value = player.full_name;
    form.querySelector('#email').value = player.email || '';
    form.querySelector('#phone').value = player.phone || '';
    form.querySelector('#birth_date').value = player.birth_date || '';
    form.querySelector('#skill_level').value = player.skill_level;
    form.querySelector('#notes').value = player.notes || '';
    form.querySelector('#active').checked = player.active;

    const coachIds = (player.coaches || []).map((coach) => String(coach.id));
    Array.from(coachSelect.options).forEach((option) => {
      if (coachIds.includes(option.value)) {
        option.selected = true;
      }
    });
  }

  function collectFormValues() {
    const coachIds = Array.from(coachSelect.selectedOptions).map((option) => parseInt(option.value, 10));
    return {
      full_name: form.querySelector('#full_name').value,
      email: form.querySelector('#email').value || null,
      phone: form.querySelector('#phone').value || null,
      birth_date: form.querySelector('#birth_date').value || null,
      skill_level: form.querySelector('#skill_level').value,
      notes: form.querySelector('#notes').value || null,
      active: form.querySelector('#active').checked,
      coach_ids: coachIds,
    };
  }

  function showAlert(message, type) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('d-none');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (alertBox) {
      alertBox.classList.add('d-none');
    }
    try {
      const payload = collectFormValues();
      if (mode === 'create') {
        await apiRequest('/players', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else if (playerId) {
        await apiRequest(`/players/${playerId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      window.location.href = '/players';
    } catch (err) {
      showAlert(err.message || 'Unable to save player', 'danger');
    }
  });
}
