import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = import.meta.env.VITE_API_V1_PREFIX || '/api/v1';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8',
  },
  timeout: 60000,  // ← 60 segundos (1 minuto)
});

// Interceptor para errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('API Error: No hay respuesta del servidor');
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;