import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  const login = (newToken) => {
    const now = Date.now();
    localStorage.setItem("token", newToken);
    localStorage.setItem("login_time", now);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("login_time");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  // 🔁 Verificar expiración del token (2 horas)
  useEffect(() => {
    const interval = setInterval(() => {
      const loginTime = parseInt(localStorage.getItem("login_time"), 10);
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;

      if (token && loginTime && now - loginTime > twoHours) {
        console.warn("Sesión expirada por tiempo");
        logout();
      }
    }, 60000); // cada minuto

    return () => clearInterval(interval);
  }, [token]);

  // 🔁 Logout por inactividad (12 horas sin eventos)
  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.warn("Sesión cerrada por inactividad");
        logout();
      }, 4 * 60 * 60 * 1000); // 4 horas
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(inactivityTimer);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
