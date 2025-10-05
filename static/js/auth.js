import { apiRequest, login, clearTokens } from './api.js';

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  clearTokens();
  const errorBox = document.getElementById('loginError');
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.classList.add('d-none');
    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      errorBox.textContent = err.message || 'Unable to sign in';
      errorBox.classList.remove('d-none');
    }
  });
}

const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  const messageBox = document.getElementById('forgotMessage');
  if (messageBox) {
    messageBox.classList.add('alert-info');
  }
  forgotForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (messageBox) {
      messageBox.classList.add('d-none');
    }
    try {
      const email = document.getElementById('forgotEmail').value.trim();
      await apiRequest('/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, { skipAuth: true });
      if (messageBox) {
        messageBox.textContent = 'If the email exists we sent a reset link.';
        messageBox.className = 'alert alert-info';
        messageBox.classList.remove('d-none');
      }
    } catch (err) {
      if (messageBox) {
        messageBox.textContent = err.message;
        messageBox.className = 'alert alert-danger';
        messageBox.classList.remove('d-none');
      }
    }
  });
}

const resetForm = document.getElementById('resetForm');
if (resetForm) {
  const alertBox = document.getElementById('resetAlert');
  resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (alertBox) {
      alertBox.classList.add('d-none');
    }
    try {
      const token = document.getElementById('resetToken').value.trim();
      const newPassword = document.getElementById('newPassword').value;
      await apiRequest('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      }, { skipAuth: true });
      if (alertBox) {
        alertBox.textContent = 'Password updated successfully. You can sign in now.';
        alertBox.className = 'alert alert-success';
        alertBox.classList.remove('d-none');
      }
    } catch (err) {
      if (alertBox) {
        alertBox.textContent = err.message || 'Reset failed';
        alertBox.className = 'alert alert-danger';
        alertBox.classList.remove('d-none');
      }
    }
  });
}


const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const alertBox = document.getElementById('registerAlert');
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (alertBox) {
      alertBox.classList.add('d-none');
    }
    const formData = new FormData(registerForm);
    const payload = {
      full_name: formData.get('full_name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      password: formData.get('password') || '',
      phone: formData.get('phone')?.trim() || null,
      address_line1: formData.get('address_line1')?.trim() || null,
      address_line2: formData.get('address_line2')?.trim() || null,
      city: formData.get('city')?.trim() || null,
      postcode: formData.get('postcode')?.trim() || null,
      country: formData.get('country')?.trim() || null,
      bank_name: formData.get('bank_name')?.trim() || null,
      account_holder_name: formData.get('account_holder_name')?.trim() || null,
      sort_code: formData.get('sort_code')?.trim() || null,
      account_number: formData.get('account_number')?.trim() || null,
      iban: formData.get('iban')?.trim() || null,
      swift_bic: formData.get('swift_bic')?.trim() || null,
      hourly_rate: null,
    };
    const hourlyRate = formData.get('hourly_rate');
    if (hourlyRate) {
      const parsed = parseFloat(hourlyRate);
      if (!Number.isNaN(parsed)) {
        payload.hourly_rate = parsed;
      }
    }

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, { skipAuth: true });
      if (alertBox) {
        alertBox.textContent = 'Coach account created. You can now sign in.';
        alertBox.className = 'alert alert-success';
        alertBox.classList.remove('d-none');
      }
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      if (alertBox) {
        alertBox.textContent = err.message || 'Registration failed';
        alertBox.className = 'alert alert-danger';
        alertBox.classList.remove('d-none');
      }
    }
  });
}
