import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach stored token on startup
const stored = JSON.parse(localStorage.getItem('goalflow-auth') || '{}');
if (stored?.state?.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${stored.state.token}`;
}

api.interceptors.request.use(config => config, Promise.reject);

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('goalflow-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
