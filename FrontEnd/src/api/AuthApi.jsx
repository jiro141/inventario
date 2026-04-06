// src/services/AuthApi.jsx
import axios from "axios";

// Base URL de tu backend Django
const BASE_URL = "http://localhost:8000/api";

// Crear instancia de Axios
const AuthApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para incluir token JWT en todas las peticiones
AuthApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // o sessionStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Puedes agregar más interceptores (por ejemplo, para respuestas con 401)

export default AuthApi;
