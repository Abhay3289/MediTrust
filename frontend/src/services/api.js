// In production (Vercel) the backend is served from the same domain under /api.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

// FastAPI validation errors arrive as a list of {loc, msg}; turn them into text.
function detailText(detail) {
  if (!Array.isArray(detail)) return detail;
  return detail
    .map((d) => String(d?.msg ?? d).replace(/^Value error, /, ''))
    .join(' ');
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(options.headers || {}),
  };

  const token = localStorage.getItem('meditrust_access_token');

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add query parameters to URL
  let url = `${API_URL}${path}`;

  if (options.params) {
    const query = new URLSearchParams();

    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const queryString = query.toString();

    if (queryString) {
      url += `?${queryString}`;
    }
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (
    response.status === 401 &&
    !options._retry &&
    localStorage.getItem('meditrust_refresh_token')
  ) {
    try {
      const rr = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: localStorage.getItem(
            'meditrust_refresh_token'
          ),
        }),
      });

      if (rr.ok) {
        const data = await rr.json();

        localStorage.setItem(
          'meditrust_access_token',
          data.access_token
        );

        localStorage.setItem(
          'meditrust_refresh_token',
          data.refresh_token
        );

        return request(path, {
          ...options,
          _retry: true,
        });
      }
    } catch {}
  }

  let data = {};

  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    const e = new Error(
      detailText(data.detail) || `Request failed (${response.status})`
    );

    e.response = {
      status: response.status,
      data,
    };

    throw e;
  }

  return {
    data,
    status: response.status,
  };
}

export const api = {
  get: (path, opts = {}) =>
    request(path, {
      ...opts,
      method: 'GET',
    }),

  post: (path, body, opts = {}) =>
    request(path, {
      ...opts,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: (path, body, opts = {}) =>
    request(path, {
      ...opts,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (path, opts = {}) =>
    request(path, {
      ...opts,
      method: 'DELETE',
    }),
};

export function apiError(
  error,
  fallback = 'Unable to connect to MediTrust server.'
) {
  return (
    detailText(error?.response?.data?.detail) ||
    error?.message ||
    fallback
  );
}