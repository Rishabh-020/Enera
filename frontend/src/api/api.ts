import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem("energy_session");

  if (raw) {
    try {
      const session = JSON.parse(raw);
      if (session?.token && typeof session.token === "string" && session.token.includes(".")) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    } catch { }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const raw = sessionStorage.getItem("energy_session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (error.response?.status === 401 && session?.token && session.token.includes(".")) {
          sessionStorage.removeItem("energy_session");
        }
      } catch { }
    }
    return Promise.reject(error);
  }
)

export default api

