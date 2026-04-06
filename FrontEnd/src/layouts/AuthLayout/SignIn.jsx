import "../css/SignIn.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/controllers/Login";
import logo4 from "../../../public/logo sincro sin fondo.png";
import logoFondo from "../../../public/fondo.jpg";
import LoginForm from "./components/LoginForm";
import { useAuth } from "../../context/AuthContext";

const SignIn = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({ ...loginForm, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await loginUser(loginForm);
      login(response.access);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.detail || "Error desconocido");
    }
  };

  return (
    <div className="auth-page">
      {/* Fondo con imagen */}
      <div
        className="auth-bg"
        style={{ backgroundImage: `url(${logoFondo})` }}
      />

      {/* Card central */}
      <div className="auth-card">
        {/* Header con logo */}
        <div className="auth-card__header">
          <img src={logo4} alt="Logo SINCRO" className="auth-logo" />
          <div className="auth-brand">
            <h1 className="auth-brand__title">SINCRO</h1>
            <p className="auth-brand__subtitle">
              Sistema de Gestión de Construcción
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="auth-card__body">
          <LoginForm
            formData={loginForm}
            onChange={handleChange}
            onSubmit={handleSubmit}
            error={error}
          />
        </div>

        {/* Footer */}
        <div className="auth-card__footer">
          <p>© {new Date().getFullYear()} SINCRO — Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
