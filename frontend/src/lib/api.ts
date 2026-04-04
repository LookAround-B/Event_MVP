import axios from 'axios';
import Cookies from 'js-cookie';

// Use relative URLs so requests go through Next.js proxy rewrites
// locally → proxied to localhost:4000, on Vercel → proxied to NEXT_PUBLIC_API_URL
const apiClient = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
