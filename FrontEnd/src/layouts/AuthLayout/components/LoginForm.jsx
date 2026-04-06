import React from "react";

const LoginForm = ({ formData, onChange, onSubmit, error }) => (
  <div className="form-container">
    <div className="form-header">
      <h2>Bienvenido de vuelta</h2>
      <p>Ingresá tus credenciales para continuar</p>
    </div>

    {error && (
      <div className="form-error">
        <span className="form-error__icon">⚠</span>
        <span>
          {error === "No active account found with the given credentials"
            ? "Credenciales incorrectas. Verificá tu usuario y contraseña."
            : error}
        </span>
      </div>
    )}

    <form className="form-fields" onSubmit={onSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="login-username">Usuario</label>
        <div className="input-wrapper">
          <span className="input-icon">👤</span>
          <input
            id="login-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={onChange}
            placeholder="Tu nombre de usuario"
            required
            autoComplete="username"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="login-password">Contraseña</label>
        <div className="input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            id="login-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Tu contraseña"
            required
            autoComplete="current-password"
          />
        </div>
      </div>

      <button type="submit" className="form-submit">
        <span>Ingresar</span>
        <span className="form-submit__arrow">→</span>
      </button>
    </form>
  </div>
);

export default LoginForm;
