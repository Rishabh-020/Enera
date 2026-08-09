import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem("energy_session");

  if (raw) {
    const session = JSON.parse(raw);

    config.headers.Authorization = `Bearer ${session.token}`
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("energy_session");
    }
    return Promise.reject(error);
  }
)
export default api
