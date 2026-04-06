import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./css/SideBar.css";
import logo from "../../public/logo sincro sin fondo.png";
import {
  FaHome,
  FaBoxOpen,
  FaChevronDown,
  FaChevronUp,
  FaTools,
  FaTruckLoading,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";

const SideBar = () => {
  const [showInventory, setShowInventory] = useState(false);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ textAlign: "center", padding: "1rem" }}>
        <img className="logoBar" src={logo} alt="Logo tipo" />
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {/* --- Dashboard --- */}
        <NavLink to="/dashboard" className="sidebar-link">
          <FaHome />
          <span>Dashboard</span>
        </NavLink>

        {/* --- Inventario --- */}
        <div
          className="sidebar-link submenu-toggle"
          onClick={() => setShowInventory(!showInventory)}
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <FaBoxOpen />
            <span>Inventario</span>
          </div>
          {showInventory ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </div>

        {showInventory && (
          <div className="submenu">
            <NavLink to="/inventario/stock" className="sidebar-sublink">
              <FaTools />
              Ferretería
            </NavLink>
          </div>
        )}

        {/* --- Proveedores --- */}
        <NavLink to="/proveedores" className="sidebar-link">
          <FaTruckLoading />
          <span>Proveedores</span>
        </NavLink>

        {/* --- Reportes --- */}
        <NavLink to="/reportes" className="sidebar-link">
          <FaFileAlt />
          <span>Notas de Entrega</span>
        </NavLink>

        {/* --- Clientes --- */}
        <NavLink to="/clientes" className="sidebar-link">
          <FaUsers />
          <span>Clientes</span>
        </NavLink>

      </nav>
    </aside>
  );
};

export default SideBar;
