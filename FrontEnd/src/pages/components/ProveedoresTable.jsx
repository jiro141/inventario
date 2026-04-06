import { useState, useEffect } from "react";
import {
  FaUserTie,
  FaPhoneAlt,
  FaBuilding,
  FaSearch,
  FaTruckLoading,
} from "react-icons/fa";
import { Link } from "react-router-dom";
export default function ProveedoresTable({ proveedores, onSearch }) {
  const [query, setQuery] = useState("");


  // 🔥 Debounce: espera 500ms antes de llamar a onSearch
  useEffect(() => {
    const delay = setTimeout(() => {
      if (onSearch) onSearch(query);
    }, 500);

    return () => clearTimeout(delay);
  }, [query, onSearch]);

  return (
    <div className="relative bg-white shadow-md rounded-lg p-5 pt-10 h-full max-h-[calc(76vh-8rem)] flex flex-col">
      {/* Header con título + barra de búsqueda */}
      <div className="flex items-center justify-between mb-4">
        {/* Título con enlace a /proveedores */}
        <Link to="/proveedores" className="flex items-center group">
          <div
            className="absolute -top-5 left-5 w-12 h-12 flex items-center justify-center rounded-lg shadow-md transition-transform group-hover:scale-105"
            style={{ backgroundColor: "#43A29E", color: "white" }}
          >
            <FaTruckLoading size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 group-hover:text-[#43A29E] transition-colors">
            Proveedores
          </h2>
        </Link>
      </div>

      {/* Contenedor scrollable */}
      <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse max-w-[520px] min-w-[520px]">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-gray-500 text-xs uppercase border-b">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Encargado</th>
              <th className="pb-2">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {(proveedores.results ? proveedores.results : proveedores).map(
              (prov) => (
                <tr
                  key={prov.id}
                  className="hover:bg-gray-50 transition-colors border-b last:border-none"
                >
                  {/* Nombre */}
                  <td className="py-2.5 px-2 text-sm font-semibold text-gray-800">
                    <span className="inline-flex items-center gap-2">
                      <FaBuilding className="text-[#43A29E]" size={14} />
                      {prov.name}
                    </span>
                  </td>

                  {/* Encargado */}
                  <td className="py-2.5 px-2 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-2">
                      <FaUserTie className="text-gray-500" size={13} />
                      {prov.encargado}
                    </span>
                  </td>

                  {/* Teléfono */}
                  <td className="py-2.5 px-2 text-sm text-gray-700">
                    <a
                      href={`https://wa.me/${prov.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-green-700"
                    >
                      <FaPhoneAlt className="text-green-600" size={13} />
                      {prov.telefono}
                    </a>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
