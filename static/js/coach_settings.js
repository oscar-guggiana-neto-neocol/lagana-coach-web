import { apiRequest } from './api.js';

const form = document.getElementById('coachSettingsForm');
if (form) {
  const alertBox = document.getElementById('coachSettingsAlert');
  const clubContainer = document.getElementById('coachClubCheckboxes');
  const defaultClubSelect = document.getElementById('default_club_id');

  let availableClubs = [];

  init();

  async function init() {
    try {
      const profile = await apiRequest('/coaches/me');
      availableClubs = profile.clubs || [];

      populateBasics(profile);
      renderClubs(profile);
    } catch (err) {
      showAlert(err.message || 'Unable to load coach profile', 'danger');
    }
  }

  function populateBasics(profile) {
    setValue('full_name', profile.full_name);
    setValue('email', profile.email);
    setValue('phone', profile.phone);
    setValue('hourly_rate', profile.hourly_rate);
    setValue('address_line1', profile.address_line1);
    setValue('address_line2', profile.address_line2);
    setValue('city', profile.city);
    setValue('postcode', profile.postcode);
    setValue('country', profile.country);
  }

  function setValue(id, value) {
    const input = document.getElementById(id);
    if (!input) return;
    if (value === null || value === undefined) {
      input.value = '';
    } else {
      input.value = value;
    }
  }

 function renderClubs(profile) {
    if (!clubContainer) return;
    clubContainer.innerHTML = '';

    const selectedClubIds = new Set((profile.clubs || []).map((club) => String(club.id)));

    availableClubs.forEach((club) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';
      const checked = selectedClubIds.has(String(club.id));
      col.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${club.id}" id="coach_club_${club.id}" ${checked ? 'checked' : ''}>
          <label class="form-check-label" for="coach_club_${club.id}">${club.name}</label>
        </div>
      `;
      clubContainer.appendChild(col);
    });

    if (!availableClubs.length) {
      clubContainer.innerHTML = '<p class="text-muted small mb-0">No clubs available. Create a club first.</p>';
    }

    populateDefaultSelect(profile.default_club_id);
    clubContainer.removeEventListener('change', handleClubChange);
    clubContainer.addEventListener('change', handleClubChange);
  }

  function handleClubChange() {
    const currentDefault = defaultClubSelect && defaultClubSelect.value ? parseInt(defaultClubSelect.value, 10) : null;
    populateDefaultSelect(currentDefault);
  }

  function populateDefaultSelect(selectedId) {
    if (!defaultClubSelect) return;
    const checkboxes = clubContainer ? Array.from(clubContainer.querySelectorAll('input[type="checkbox"]')) : [];
    const selectedClubIds = checkboxes.filter((input) => input.checked).map((input) => input.value);

    const previousValue = selectedId !== undefined ? selectedId : defaultClubSelect.value;

    defaultClubSelect.innerHTML = '<option value="">None</option>';
    selectedClubIds.forEach((id) => {
      const club = availableClubs.find((item) => String(item.id) === String(id));
      if (!club) return;
      const option = document.createElement('option');
      option.value = club.id;
      option.textContent = club.name;
      defaultClubSelect.appendChild(option);
    });

    if (previousValue && selectedClubIds.includes(String(previousValue))) {
      defaultClubSelect.value = String(previousValue);
    } else {
      defaultClubSelect.value = '';
    }
  }

  function collectPayload() {
    const payload = {
      full_name: getValue('full_name'),
      email: getValue('email'),
      phone: getValue('phone'),
      hourly_rate: getNumericValue('hourly_rate'),
      address_line1: getValue('address_line1'),
      address_line2: getValue('address_line2'),
      city: getValue('city'),
      postcode: getValue('postcode'),
      country: getValue('country'),
      club_ids: clubContainer
        ? Array.from(clubContainer.querySelectorAll('input[type="checkbox"]:checked')).map((input) => parseInt(input.value, 10))
        : [],
      default_club_id: defaultClubSelect && defaultClubSelect.value
        ? parseInt(defaultClubSelect.value, 10)
        : null,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === '' || payload[key] === undefined) {
        payload[key] = null;
      }
    });

    return payload;
  }

  function getValue(id) {
    const input = document.getElementById(id);
    return input ? input.value.trim() : null;
  }

  function getNumericValue(id) {
    const value = getValue(id);
    if (!value) return null;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function showAlert(message, type = 'success') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} mb-0`;
    alertBox.classList.remove('d-none');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showAlert('Saving…', 'info');
    try {
      const payload = collectPayload();
      if (payload.default_club_id && !payload.club_ids.includes(payload.default_club_id)) {
        payload.club_ids.push(payload.default_club_id);
      }
      await apiRequest('/coaches/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      showAlert('Profile updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update coach profile', err);
      showAlert(err.message || 'Unable to update profile', 'danger');
    }
  });
}
