import React, { useState, useEffect, useMemo } from "react";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";

export default function Accordion({
  title,
  icon: Icon,
  children,
  data = [],
  filterKeys = ["name", "modelo"],
  onFilter,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
 

  // 🔎 Debounce de búsqueda
  useEffect(() => {
    if (!onFilter) return;
    const delay = setTimeout(() => {
      onFilter(query);
    }, 400);
    return () => clearTimeout(delay);
  }, [query, onFilter]);

  // 🧠 Filtro local
  const filteredData = useMemo(() => {
    if (!query) return data;
    return data.filter((item) =>
      filterKeys.some((key) =>
        String(item[key] || "")
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    );
  }, [data, query, filterKeys]);

  return (
    <div className="border rounded-lg mb-3 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 text-left font-semibold hover:bg-gray-100 transition-all"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-gray-600" />}
          <span>{title}</span>
        </div>
        {isOpen ? (
          <FaChevronUp className="text-gray-500" />
        ) : (
          <FaChevronDown className="text-gray-500" />
        )}
      </button>

      {/* Contenido */}
      <div
        className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        {isOpen && (
          <div className="p-3 overflow-y-auto max-h-[450px]">
            {/* Buscador */}
            <div className="relative mb-3 w-full">
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o modelo..."
                className="pl-8 pr-3 py-1 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#43A29E] text-black w-full"
              />
            </div>
            {/* 🔥 Aquí está la clave */}
            <div>
              {typeof children === "function"
                ? children(filteredData)
                : children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
