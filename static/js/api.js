const config = window.APP_CONFIG || {};
const API_BASE_URL = config.apiBaseUrl || 'http://localhost:8000/api/v1';
const FRONTEND_BASE_URL = config.frontendBaseUrl || window.location.origin;
const STORAGE_KEY = 'laganacoach.tokens';
const SESSION_COOKIE = 'lagana_session';

function getStoredTokens() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : { accessToken: null, refreshToken: null };
}

function storeTokens(tokens) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${SESSION_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
}

async function refreshAccessToken() {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    clearTokens();
    return null;
  }
  const data = await response.json();
  storeTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
  return data.access_token;
}

export async function apiRequest(path, options = {}, { skipAuth = false } = {}) {
  const tokens = getStoredTokens();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (!skipAuth && tokens.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      redirectToLogin();
      throw new Error('Authentication required');
    }
    headers.set('Authorization', `Bearer ${newToken}`);
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  }

  if (!response.ok) {
    let detail = 'Request failed';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch (err) {
      // ignore json errors
    }
    throw new Error(detail);
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  if (contentType.includes('application/pdf') || contentType.includes('text/csv')) {
    return response.blob();
  }
  return response.text();
}

export function redirectToLogin() {
  clearTokens();
  window.location.href = `${FRONTEND_BASE_URL}/login`;
}

export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, { skipAuth: true });
  storeTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${SESSION_COOKIE}=1; Max-Age=${maxAge}; path=/; SameSite=Lax`;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' }, { skipAuth: true });
  } catch (err) {
    // ignore
  }
  clearTokens();
  window.location.href = `${FRONTEND_BASE_URL}/login`;
}

export async function getCurrentUser() {
  return apiRequest('/auth/me', { method: 'GET' });
}

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', () => logout());
}
