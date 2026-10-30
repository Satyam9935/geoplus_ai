import axios from 'axios';

// Automatically uses your Render backend when deployed,
// or falls back to localhost when developing on your machine
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout accommodates Render cold starts
});

// Optional: Interceptors for debugging network requests in the browser console
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API call error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;