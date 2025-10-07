import { apiRequest, getCurrentUser } from './api.js';

const form = document.getElementById('lessonForm');
if (form) {
  const mode = form.dataset.mode;
  const lessonId = form.dataset.lessonId;
  const alertBox = document.getElementById('lessonFormAlert');
  const coachSelect = document.getElementById('coach_id');
  const clubSelect = document.getElementById('club_id');
  const playerContainer = document.getElementById('playerCheckboxes');
  const strokeContainer = document.getElementById('strokeCheckboxes');
  const playersHelp = document.getElementById('playersHelp');
  const courtContainer = document.getElementById('courtCheckboxes');
  const courtsHelp = document.getElementById('courtsHelp');

  let availableClubs = [];
  let defaultClubId = null;

  init();

  async function init() {
    try {
      const user = await getCurrentUser();
      await Promise.all([
        populateCoaches(user),
        populateClubs(user),
        populatePlayers(),
        populateStrokes(),
      ]);
      if (mode === 'edit' && lessonId) {
        await loadLesson(lessonId, user);
      } else if (clubSelect && clubSelect.value) {
        renderCourts();
      } else if (clubSelect && defaultClubId && mode !== 'edit') {
        clubSelect.value = String(defaultClubId);
        renderCourts();
      }
      if (user.role === 'coach') {
        coachSelect.disabled = true;
      }
    } catch (err) {
      console.error('Lesson form initialization error:', err);
      const errorMessage = err.message || err.toString() || 'Unable to load lesson data';
      showAlert(errorMessage, 'danger');
    }
  }

  async function populateCoaches(user) {
    if (!coachSelect) return;
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

  async function populateClubs(user) {
    if (!clubSelect) return;
    clubSelect.innerHTML = '';
    let clubs = [];
    if (user.role === 'coach') {
      const profile = await apiRequest('/coaches/me');
      defaultClubId = profile?.default_club_id ?? null;
      clubs = profile?.clubs || [];
    } else {
      const response = await apiRequest('/clubs?page=1&size=200');
      clubs = response.items || [];
    }
    availableClubs = clubs;

    if (!clubs.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No clubs available';
      option.disabled = true;
      option.selected = true;
      clubSelect.appendChild(option);
      if (courtsHelp) {
        courtsHelp.textContent = 'Add a club first to select courts.';
        courtsHelp.classList.add('text-danger');
      }
      return;
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a club';
    placeholder.disabled = true;
    placeholder.selected = true;
    clubSelect.appendChild(placeholder);

    clubs.forEach((club) => {
      const option = document.createElement('option');
      option.value = club.id;
      option.textContent = club.name;
      clubSelect.appendChild(option);
    });

    if (mode !== 'edit') {
      if (defaultClubId && clubs.some((club) => club.id === defaultClubId)) {
        clubSelect.value = String(defaultClubId);
      } else {
        clubSelect.value = String(clubs[0].id);
      }
      renderCourts();
    }
  }

  async function populatePlayers() {
    if (!playerContainer) return;
    playerContainer.innerHTML = '';
    const data = await apiRequest('/players?page=1&size=200');
    (data.items || []).forEach((player) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';
      col.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${player.id}" id="player_${player.id}">
          <label class="form-check-label" for="player_${player.id}">${player.full_name}</label>
        </div>
      `;
      playerContainer.appendChild(col);
    });
  }

  async function populateStrokes() {
    if (!strokeContainer) return;
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

  async function loadLesson(id) {
    const lesson = await apiRequest(`/lessons/${id}`);
    document.getElementById('date').value = lesson.date;
    document.getElementById('start_time').value = lesson.start_time?.substring(0, 5) || '';
    document.getElementById('end_time').value = lesson.end_time?.substring(0, 5) || '';
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

    if (clubSelect && lesson.club_id) {
      clubSelect.value = String(lesson.club_id);
    }
    renderCourts((lesson.courts || []).map((court) => court.id));

    const playerIds = new Set((lesson.players || []).map((player) => String(player.id)));
    playerIds.forEach((id) => {
      const checkbox = document.getElementById(`player_${id}`);
      if (checkbox) checkbox.checked = true;
    });

    const strokeCodes = (lesson.strokes || []).map((stroke) => stroke.code);
    strokeCodes.forEach((code) => {
      const checkbox = document.getElementById(`stroke_${code}`);
      if (checkbox) checkbox.checked = true;
    });

    togglePlayerRequirement();
  }

  function renderCourts(selectedIds = []) {
    if (!courtContainer || !clubSelect) return;
    courtContainer.innerHTML = '';
    const clubId = parseInt(clubSelect.value, 10);
    const club = availableClubs.find((item) => item.id === clubId);
    const courts = club?.courts || [];

    if (!clubId || !courts.length) {
      courtContainer.innerHTML = '<p class="text-muted small mb-0">No courts available for this club.</p>';
      if (courtsHelp) {
        courtsHelp.textContent = clubId ? 'Courts are optional when none are configured for the club.' : 'Select a club to choose courts.';
        courtsHelp.classList.remove('text-danger');
        courtsHelp.classList.add('text-muted');
      }
      return;
    }

    if (courtsHelp) {
      courtsHelp.textContent = 'Select the courts that will be used for this lesson.';
      courtsHelp.classList.remove('text-danger');
      courtsHelp.classList.add('text-muted');
    }

    const selectedSet = new Set((selectedIds || []).map((id) => String(id)));
    courts.forEach((court) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';
      const isChecked = selectedSet.has(String(court.id));
      col.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${court.id}" id="court_${court.id}" ${isChecked ? 'checked' : ''}>
          <label class="form-check-label" for="court_${court.id}">${court.name}${court.active ? '' : ' (inactive)'}</label>
        </div>
      `;
      courtContainer.appendChild(col);
    });
  }

  function togglePlayerRequirement() {
    const typeValue = document.getElementById('type').value;
    const requiresPlayers = typeValue !== 'club';
    if (playersHelp) {
      playersHelp.textContent = requiresPlayers
        ? 'Select at least one player for private lessons.'
        : 'Players are optional for club lessons.';
      playersHelp.classList.toggle('text-danger', requiresPlayers);
      playersHelp.classList.toggle('text-muted', !requiresPlayers);
    }
  }

  function collectPayload() {
    const playerIds = playerContainer
      ? Array.from(playerContainer.querySelectorAll('input[type="checkbox"]:checked')).map((input) => parseInt(input.value, 10))
      : [];
    const strokeCodes = strokeContainer
      ? Array.from(strokeContainer.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value)
      : [];
    const courtIds = courtContainer
      ? Array.from(courtContainer.querySelectorAll('input[type="checkbox"]:checked')).map((input) => parseInt(input.value, 10))
      : [];
    const clubIdValue = clubSelect && clubSelect.value ? parseInt(clubSelect.value, 10) : null;

    return {
      coach_id: parseInt(coachSelect.value, 10),
      date: document.getElementById('date').value,
      start_time: document.getElementById('start_time').value,
      end_time: document.getElementById('end_time').value,
      total_amount: parseFloat(document.getElementById('total_amount').value || '0'),
      club_reimbursement_amount: document.getElementById('club_reimbursement_amount').value
        ? parseFloat(document.getElementById('club_reimbursement_amount').value)
        : null,
      type: document.getElementById('type').value,
      status: document.getElementById('status').value,
      payment_status: document.getElementById('payment_status').value,
      notes: document.getElementById('notes').value || null,
      player_ids: playerIds,
      stroke_codes: strokeCodes,
      club_id: clubIdValue,
      court_ids: courtIds,
    };
  }

  function showAlert(message, type) {
    if (!alertBox) return;
    const errorMessage = typeof message === 'string' ? message : (message && message.message) || 'An unexpected error occurred';
    alertBox.textContent = errorMessage;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('d-none');
    console.error('Lesson form error:', message);
  }

  document.getElementById('type').addEventListener('change', () => {
    togglePlayerRequirement();
  });
  togglePlayerRequirement();

  if (clubSelect) {
    clubSelect.addEventListener('change', () => {
      renderCourts();
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (alertBox) alertBox.classList.add('d-none');
    try {
      const payload = collectPayload();
      if (payload.type !== 'club' && payload.player_ids.length === 0) {
        throw new Error('Select at least one player for private lessons.');
      }

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
      console.error('Lesson form submission error:', err);
      const errorMessage = err.message || err.toString() || 'Unable to save lesson';
      showAlert(errorMessage, 'danger');
    }
  });
}
