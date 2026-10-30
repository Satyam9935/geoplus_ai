import axios from 'axios';

// Ensure the live backend URL is used even if build env vars fail
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://geoplus-ai.onrender.com/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

export default apiClient;