// src/services/LoginService.jsx
import AuthApi from "../AuthApi";
export const loginUser = async ({ username, password }) => {
  try {
    const response = await AuthApi.post("/auth/login/", {
      username,
      password,
    });

    // Guarda token si es parte del response
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  } catch (error) {
    // Manejo de error personalizado
    throw error.response?.data || { detail: "Error al iniciar sesión" };
  }
};
