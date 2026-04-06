// src/api/controllers/Register.js
import AuthApi from "../AuthApi"; // Asegúrate de tener configurado axios con interceptores

export const registerUser = async (data) => {
  const response = await AuthApi.post("/usuarios/registro/", data);
  return response.data;
};
