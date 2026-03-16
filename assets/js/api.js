// ============================================================
// api.js - Global AJAX/Fetch Utility with CSRF
// ============================================================
export const Api = (() => {
  let csrfToken = '';
  const BASE = (window.APP_PATH || '/app-git') + '/api';

  const setCsrf = (token) => { csrfToken = token; };
  const getCsrf = () => csrfToken;

  function flatten(data, form, prefix = '') {
    for (const [k, v] of Object.entries(data)) {
      const key = prefix ? `${prefix}[${k}]` : k;
      if (Array.isArray(v)) {
        v.forEach(i => form.append(`${key}[]`, i));
      } else if (v !== null && typeof v === 'object' && !(v instanceof File)) {
        flatten(v, form, key);
      } else {
        form.append(key, v ?? '');
      }
    }
  }

  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE}/${endpoint}`;
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    };

    if (csrfToken && options.method && options.method !== 'GET') {
      headers['X-CSRF-Token'] = csrfToken;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      return await res.json();
    } catch (err) {
      console.error('[Api Error]', err);
      return { success: false, message: 'Network error or server down' };
    }
  }

  const postLike = (method, end, data) => {
    if (data instanceof FormData) {
      return request(end, { method, body: data });
    }
    const form = new URLSearchParams();
    flatten(data || {}, form);
    return request(end, {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
  };

  return {
    setCsrf,
    getCsrf,
    get:  (end, params) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return request(`${end}${qs}`);
    },
    post:   (end, data) => postLike('POST', end, data),
    put:    (end, data) => postLike('PUT', end, data),
    delete: (end, data) => postLike('DELETE', end, data),
  };
})();

export const Toast = {
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
