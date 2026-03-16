// ============================================================
// api.js - Global AJAX/Fetch Utility with CSRF
// ============================================================
const Api = (() => {
  let csrfToken = '';
  const BASE = '/app-git/api';

  const setCsrf = (token) => { csrfToken = token; };
  const getCsrf = () => csrfToken;

  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE}/${endpoint}`;
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    };
    // Attach CSRF on mutating requests
    if (csrfToken && options.method && options.method !== 'GET') {
      headers['X-CSRF-Token'] = csrfToken;
    }

    try {
      const resp = await fetch(url, { ...options, headers });

      if (resp.status === 401) {
        // Session expired
        App.logout(true);
        return;
      }

      const json = await resp.json();
      return json;
    } catch (err) {
      console.error('[Api] request error:', err);
      return { success: false, message: 'Network error atau server tidak merespons' };
    }
  }

  async function get(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${endpoint}?${qs}` : endpoint;
    return request(url, { method: 'GET' });
  }

  async function post(endpoint, data = {}) {
    const form = new URLSearchParams();
    // Flatten nested objects (like settings[key]=val)
    const flatten = (obj, prefix = '') => {
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}[${k}]` : k;
        if (Array.isArray(v)) {
          v.forEach(i => form.append(`${key}[]`, i));
        } else if (v !== null && typeof v === 'object') {
          flatten(v, key);
        } else {
          form.append(key, v ?? '');
        }
      }
    };
    flatten(data);
    return request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
  }

  return { get, post, setCsrf, getCsrf };
})();

// ============================================================
// Toast notifications
// ============================================================
const Toast = {
  show(msg, type = 'info', duration = 3000) {
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: duration,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    }).fire({
      icon: type,
      title: msg
    });
  },
  success: (m) => Toast.show(m, 'success'),
  error:   (m) => Toast.show(m, 'error'),
  info:    (m) => Toast.show(m, 'info'),
};
