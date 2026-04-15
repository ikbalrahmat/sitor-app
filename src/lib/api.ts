import axios from 'axios';

// Base URL dari environment variable (.env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Axios instance yang sudah dikonfigurasi
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Accept': 'application/json',
  },
});

// Interceptor: otomatis pasang token di setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export base URL untuk kebutuhan storage path (foto, sertifikat, dll)
export const STORAGE_URL = `${API_BASE_URL}/storage`;

export default api;
