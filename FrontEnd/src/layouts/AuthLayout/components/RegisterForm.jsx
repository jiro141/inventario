import React from "react";

const RegisterForm = ({ formData, onChange, onSubmit, error }) => (
  <div className="form-container">
    <div className="form-header">
      <h2>Crear cuenta</h2>
      <p>Completá tus datos para registrarte</p>
    </div>

    {error && (
      <div className="form-error">
        <span className="form-error__icon">⚠</span>
        <span>{error}</span>
      </div>
    )}

    <form className="form-fields" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="reg-first_name">Nombre</label>
          <div className="input-wrapper">
            <input
              id="reg-first_name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={onChange}
              placeholder="Tu nombre"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="reg-last_name">Apellido</label>
          <div className="input-wrapper">
            <input
              id="reg-last_name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={onChange}
              placeholder="Tu apellido"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="reg-email">Correo electrónico</label>
        <div className="input-wrapper">
          <span className="input-icon">✉</span>
          <input
            id="reg-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="correo@ejemplo.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="reg-username">Usuario</label>
        <div className="input-wrapper">
          <span className="input-icon">👤</span>
          <input
            id="reg-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={onChange}
            placeholder="Nombre de usuario"
            required
            autoComplete="username"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="reg-password">Contraseña</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              id="reg-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="reg-confirm">Confirmar</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              id="reg-confirm"
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={onChange}
              placeholder="Repetí la contraseña"
              required
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      <button type="submit" className="form-submit">
        <span>Crear cuenta</span>
        <span className="form-submit__arrow">→</span>
      </button>
    </form>
  </div>
);

export default RegisterForm;
