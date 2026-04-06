import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSignOutAlt, FaBars } from "react-icons/fa";
import "./css/NavBar.css";

const NavBar = ({ onToggleSidebar }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const currentPath = location.pathname.split("/")[1] || "Inicio";
  const pageTitle = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  return (
    <header className="navbar">
      <div className="navbar__left">
        {onToggleSidebar && (
          <button
            className="navbar__menu-btn"
            onClick={onToggleSidebar}
            aria-label="Abrir menú"
          >
            <FaBars size={20} />
          </button>
        )}
        <span className="navbar-brand">{pageTitle}</span>
      </div>
      <button className="logout-button" onClick={logout} aria-label="Cerrar sesión">
        <FaSignOutAlt size={18} />
      </button>
    </header>
  );
};

export default NavBar;
