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

// Interceptor: otomatis bersihkan sesi jika server menolak token (401)
// Ini mencegah bug dimana user lama tetap "terjebak" di sesi yang sudah expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Hanya auto-clear jika BUKAN di halaman login (agar error login tampil normal)
      if (currentPath !== '/login') {
        localStorage.clear();
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export base URL untuk kebutuhan storage path (foto, sertifikat, dll)
export const STORAGE_URL = `${API_BASE_URL}/storage`;

export default api;
