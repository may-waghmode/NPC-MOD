/**
 * Axios API client with Firebase auth token interceptor.
 * Every request automatically gets the current user's ID token.
 */
import axios from 'axios';
import { auth } from '../firebase/config';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Network error';
    const code = err.response?.data?.code || 'UNKNOWN';
    return Promise.reject({ message, code, status: err.response?.status });
  }
);

export default api;
