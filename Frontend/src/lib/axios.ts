import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token CSRF
api.interceptors.request.use(
  (config) => {
    const cookies = document.cookie.split('; ');
    const xsrfCookie = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
    
    if (xsrfCookie) {
      const token = decodeURIComponent(xsrfCookie.split('=')[1]);
      config.headers['X-XSRF-TOKEN'] = token;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;