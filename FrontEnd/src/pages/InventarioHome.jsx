import React from "react";
import useInventario from "../hooks/useInventario";
import Tables from "../components/Tables";

const columns = {
  stock: [
    { key: "codigo", label: "Código" },
    { key: "descripcion", label: "Descripción" },
    { key: "pza", label: "Unidad" },
    { key: "costo", label: "Costo" },
  ],
};

export default function InventarioHome() {
  const { data: stockData, loading: stockLoading } = useInventario("stock");
  console.log("hola");

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6">
      <div className="w-full">
        <Tables
          title="Ferretería"
          columns={columns.stock}
          data={stockData}
          loading={stockLoading}
        />
      </div>
    </div>
  );
}
