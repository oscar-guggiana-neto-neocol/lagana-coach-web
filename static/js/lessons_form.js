import { apiRequest, getCurrentUser } from './api.js';

const form = document.getElementById('lessonForm');
if (form) {
  const mode = form.dataset.mode;
  const lessonId = form.dataset.lessonId;
  const alertBox = document.getElementById('lessonFormAlert');
  const coachSelect = document.getElementById('coach_id');
  const playerSelect = document.getElementById('player_ids');
  const strokeContainer = document.getElementById('strokeCheckboxes');

  init();

  async function init() {
    try {
      const user = await getCurrentUser();
      await populateCoaches(user);
      await populatePlayers();
      await populateStrokes();
      if (mode === 'edit' && lessonId) {
        await loadLesson(lessonId, user);
      }
      if (user.role === 'coach') {
        coachSelect.disabled = true;
      }
    } catch (err) {
      showAlert(err.message || 'Unable to load lesson data', 'danger');
    }
  }

  async function populateCoaches(user) {
    coachSelect.innerHTML = '';
    if (user.role === 'coach') {
      const coach = await apiRequest('/coaches/me');
      const option = document.createElement('option');
      option.value = coach.id;
      option.textContent = coach.full_name;
      option.selected = true;
      coachSelect.appendChild(option);
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

  async function populatePlayers() {
    playerSelect.innerHTML = '';
    const data = await apiRequest('/players?page=1&size=200');
    (data.items || []).forEach((player) => {
      const option = document.createElement('option');
      option.value = player.id;
      option.textContent = player.full_name;
      playerSelect.appendChild(option);
    });
  }

  async function populateStrokes() {
    strokeContainer.innerHTML = '';
    const strokes = await apiRequest('/strokes?page=1&size=100');
    (strokes.items || []).forEach((stroke) => {
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4';
      col.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${stroke.code}" id="stroke_${stroke.code}">
          <label class="form-check-label" for="stroke_${stroke.code}">${stroke.label}</label>
        </div>
      `;
      strokeContainer.appendChild(col);
    });
  }

  async function loadLesson(id, user) {
    const lesson = await apiRequest(`/lessons/${id}`);
    document.getElementById('date').value = lesson.date;
    document.getElementById('start_time').value = lesson.start_time?.substring(0,5) || '';
    document.getElementById('end_time').value = lesson.end_time?.substring(0,5) || '';
    document.getElementById('total_amount').value = lesson.total_amount;
    document.getElementById('club_reimbursement_amount').value = lesson.club_reimbursement_amount || '';
    document.getElementById('type').value = lesson.type;
    document.getElementById('status').value = lesson.status;
    document.getElementById('payment_status').value = lesson.payment_status;
    document.getElementById('notes').value = lesson.notes || '';

    Array.from(coachSelect.options).forEach((option) => {
      if (String(option.value) === String(lesson.coach_id)) {
        option.selected = true;
      }
    });

    const playerIds = (lesson.players || []).map((player) => String(player.id));
    Array.from(playerSelect.options).forEach((option) => {
      if (playerIds.includes(option.value)) {
        option.selected = true;
      }
    });

    const strokeCodes = (lesson.strokes || []).map((stroke) => stroke.code);
    strokeCodes.forEach((code) => {
      const checkbox = document.getElementById(`stroke_${code}`);
      if (checkbox) checkbox.checked = true;
    });
  }

  function collectPayload() {
    const playerIds = Array.from(playerSelect.selectedOptions).map((option) => parseInt(option.value, 10));
    const strokeCodes = Array.from(strokeContainer.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
    return {
      coach_id: parseInt(coachSelect.value, 10),
      date: document.getElementById('date').value,
      start_time: document.getElementById('start_time').value,
      end_time: document.getElementById('end_time').value,
      total_amount: parseFloat(document.getElementById('total_amount').value || '0'),
      club_reimbursement_amount: document.getElementById('club_reimbursement_amount').value ? parseFloat(document.getElementById('club_reimbursement_amount').value) : null,
      type: document.getElementById('type').value,
      status: document.getElementById('status').value,
      payment_status: document.getElementById('payment_status').value,
      notes: document.getElementById('notes').value || null,
      player_ids: playerIds,
      stroke_codes: strokeCodes,
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
    if (alertBox) alertBox.classList.add('d-none');
    try {
      const payload = collectPayload();
      if (mode === 'create') {
        await apiRequest('/lessons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else if (lessonId) {
        await apiRequest(`/lessons/${lessonId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      window.location.href = '/lessons';
    } catch (err) {
      showAlert(err.message || 'Unable to save lesson', 'danger');
    }
  });
}
