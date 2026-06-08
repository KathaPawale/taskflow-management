import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("taskflow_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("taskflow_token");
      localStorage.removeItem("taskflow_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  googleLogin: (token: string) =>
    api.post("/auth/google", { token }).then((r) => r.data),
  getMe: () => api.get("/auth/me").then((r) => r.data),
};

// Tasks
export const tasksApi = {
  getAll: () => api.get("/tasks/").then((r) => r.data),
  getOne: (id: string) => api.get(`/tasks/${id}`).then((r) => r.data),
  create: (data: object) => api.post("/tasks/", data).then((r) => r.data),
  update: (id: string, data: object) => api.patch(`/tasks/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

// Users
export const usersApi = {
  getAll: () => api.get("/users/").then((r) => r.data),
};
