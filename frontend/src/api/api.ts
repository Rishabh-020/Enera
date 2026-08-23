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

    // Extract real backend exception/error message for all APIs
    const resData = error.response?.data;
    let serverMessage: string | null = null;

    if (typeof resData === "string" && resData.trim()) {
      serverMessage = resData.trim();
    } else if (resData && typeof resData === "object") {
      if (typeof resData.message === "string" && resData.message.trim()) {
        serverMessage = resData.message.trim();
      } else if (typeof resData.error === "string" && resData.error.trim()) {
        serverMessage = resData.error.trim();
      } else if (typeof resData.details === "string" && resData.details.trim()) {
        serverMessage = resData.details.trim();
      } else if (Array.isArray(resData.errors)) {
        serverMessage = resData.errors
          .map((e: any) => (typeof e === "string" ? e : e?.defaultMessage || e?.message || JSON.stringify(e)))
          .filter(Boolean)
          .join(", ");
      } else if (resData.errors && typeof resData.errors === "object") {
        serverMessage = Object.values(resData.errors)
          .map((v: any) => (typeof v === "string" ? v : v?.message || JSON.stringify(v)))
          .join(", ");
      }
    }

    if (serverMessage && typeof serverMessage === "string") {
      error.message = serverMessage;
    }

    return Promise.reject(error);
  }
);

export default api

