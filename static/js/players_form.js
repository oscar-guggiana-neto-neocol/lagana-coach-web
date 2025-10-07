import { apiRequest, getCurrentUser } from './api.js';

const form = document.getElementById('playerForm');
if (!form) {
  // nothing to do
} else {
  const mode = form.dataset.mode;
  const playerId = form.dataset.playerId;
  const alertBox = document.getElementById('playerFormAlert');
  const coachSelect = document.getElementById('coach_ids');
  const lessonsSection = document.getElementById('playerLessonsSection');
  const lessonsTableBody = document.querySelector('#playerLessonsTable tbody');
  const lessonsEmpty = document.getElementById('playerLessonsEmpty');

  const statusClasses = {
    draft: 'bg-secondary',
    set: 'bg-info text-dark',
    executed: 'bg-success',
    invoiced: 'bg-dark',
  };

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

    if (lessonsSection && lessonsTableBody) {
      await loadPlayerLessons(id);
    }
  }

  function formatLabel(text) {
    if (!text) return '';
    return text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function formatStrokes(strokes) {
    if (!strokes || strokes.length === 0) {
      return '<span class="text-muted">No strokes recorded</span>';
    }
    return strokes
      .map((stroke) => `<span class="badge bg-light text-dark me-1 mb-1">${stroke.label}</span>`)
      .join('');
  }

  async function loadPlayerLessons(id) {
    try {
      lessonsTableBody.innerHTML = '';
      if (lessonsEmpty) lessonsEmpty.classList.add('d-none');

      const params = new URLSearchParams({ page: '1', size: '100', player_id: id });
      const data = await apiRequest(`/lessons?${params.toString()}`);
      const lessons = data.items || [];

      if (!lessons.length) {
        if (lessonsEmpty) lessonsEmpty.classList.remove('d-none');
        return;
      }

      lessons.forEach((lesson) => {
        const row = document.createElement('tr');
        const startTime = lesson.start_time ? lesson.start_time.substring(0, 5) : '';
        const endTime = lesson.end_time ? lesson.end_time.substring(0, 5) : '';
        const statusClass = statusClasses[lesson.status] || 'bg-secondary';
        row.innerHTML = `
          <td>${lesson.date || ''}</td>
          <td>${startTime}${endTime ? ` - ${endTime}` : ''}</td>
          <td>${formatLabel(lesson.type)}</td>
          <td><span class="badge ${statusClass}">${formatLabel(lesson.status)}</span></td>
          <td>${formatStrokes(lesson.strokes)}</td>
        `;
        lessonsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error('Failed to load player lessons', err);
      if (lessonsEmpty) {
        lessonsEmpty.textContent = 'Unable to load lesson history.';
        lessonsEmpty.classList.remove('d-none');
      }
    }
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
