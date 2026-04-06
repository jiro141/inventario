import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "../layouts/AuthLayout/SignIn";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import Dashboard from "../pages/Dashboard";
import InventarioHome from "../pages/InventarioHome";
import StockLayout from "../layouts/InventoryLayout/StockLayout";
import ProveedoresHome from "../pages/ProveedoresHome";
import ReportesLayout from "../layouts/ReportesLayout/ReportesLayout";
import ClientesLayout from "../layouts/ClientesLayout/ClientesLayout";

const AppRouter = () => {
  return (

    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<SignIn />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="inventario">
            <Route index />
            <Route path="stock" element={<StockLayout />} />
          </Route>
          <Route path="proveedores" element={<ProveedoresHome />} />

          <Route path="reportes" element={<ReportesLayout />} />
          <Route path="clientes" element={<ClientesLayout />} />

        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<SignIn />} />
    </Routes>

  );
};

export default AppRouter;
