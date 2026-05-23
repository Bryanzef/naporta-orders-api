const API_BASE = '/api/v1';
const TOKEN_KEY = 'naporta_access_token';
const USER_KEY = 'naporta_user_email';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUserEmail() {
  return localStorage.getItem(USER_KEY);
}

export function setSession(accessToken, email) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function formatErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (Array.isArray(payload.message)) return payload.message.join(', ');
  if (typeof payload.message === 'string') return payload.message;
  return fallback;
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const token = getToken();
  if (token && !options.skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      formatErrorMessage(payload, `Erro ${response.status}`),
    );
  }

  if (payload?.success === true) {
    return payload.data;
  }

  return payload;
}

export const authApi = {
  login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
  },

  register(name, email, password) {
    return apiRequest('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ name, email, password }),
    });
  },
};

export const ordersApi = {
  list(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        query.set(key, String(value));
      }
    });
    const qs = query.toString();
    return apiRequest(`/orders${qs ? `?${qs}` : ''}`);
  },

  getById(id) {
    return apiRequest(`/orders/${id}`);
  },

  create(body) {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(id, body) {
    return apiRequest(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  remove(id) {
    return apiRequest(`/orders/${id}`, { method: 'DELETE' });
  },
};
