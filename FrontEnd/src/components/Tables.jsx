import React from "react";
import { BounceLoader } from "react-spinners";
import {
  FaSearch,
  FaSave,
  FaSyncAlt,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import Modal from "./Modal";
import UtilityPercentagesModal from "./UtilityPercentagesModal";
import StockProveedorModal from "./StockProveedorModal";
import useTables, { getValorColPorcentaje, formatCosto } from "./hooks/useTables";

const Tables = ({
  data = [],
  loading,
  title,
  onAdd,
  onSearch,
  tipo,
  refetch,
  tasa,
  tasaLoading,
  tasaRefetch,
}) => {
  const {
    columns,
    query,
    setQuery,
    isDeleteModalOpen,
    selectedItemName,
    editando,
    valorTaza,
    setEditando,
    setValorTaza,
    isUtilityModalOpen,
    setUtilityModalOpen,
    expandedRows,
    stockProveedoresData,
    isProveedorModalOpen,
    selectedStockId,
    editingStockProveedor,
    handleDeleteClick,
    confirmDelete,
    handleGuardar,
    formatDisplayValue,
    handleCellClick,
    toggleExpandRow,
    handleAddProveedor,
    handleEditProveedor,
    handleDeleteProveedor,
    handleProveedorSaved,
    getPreferido,
    proveedores,
  } = useTables({
    data,
    loading,
    tipo,
    refetch,
    tasa,
    tasaLoading,
    tasaRefetch,
    onAdd,
    onSearch,
  });

  const handleDelete = (id, name) => {
    handleDeleteClick(id, name);
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      {/* HEADER */}
      <div className="px-6 py-4 bg-[#43A29E] border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">{title}</h2>

        {/* CAMPO DE TASA */}
        {tasaLoading ? (
          <p className="text-gray-300 text-sm">Cargando tasa...</p>
        ) : tasa ? (
          <div className="flex flex-col gap-2 text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-m font-semibold text-white ">Tasa:</h2>
              <input
                type="number"
                step="0.0001"
                disabled={!editando}
                value={valorTaza}
                onChange={(e) => setValorTaza(e.target.value)}
                className={`border rounded-lg px-3 py-2 w-28 text-gray-900 ${
                  editando
                    ? "focus:outline-none focus:ring-2 focus:ring-blue-300 border-blue-300"
                    : "bg-gray-100 cursor-not-allowed"
                }`}
              />
              <h2 className="text-m font-semibold text-white ">$</h2>
              {editando ? (
                <button
                  onClick={handleGuardar}
                  className="bg-[#2B3744] hover:bg-white hover:text-[#2B3744] text-white px-3 py-2 rounded-lg flex items-center gap-2 transition border border-[#2B3744]"
                >
                  <FaSave size={14} /> Guardar
                </button>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="bg-[#2B3744] hover:bg-white hover:text-[#2B3744] text-white px-3 py-2 rounded-lg flex items-center gap-2 transition border border-[#2B3744]"
                >
                  <FaSyncAlt size={14} /> Editar
                </button>
              )}
              {/* Botón para editar porcentajes de utilidad */}
              <button
                onClick={() => setUtilityModalOpen(true)}
                className="bg-[#2B3744] hover:bg-white hover:text-[#2B3744] text-white px-3 py-2 rounded-lg flex items-center gap-2 transition border border-[#2B3744]"
              >
                % Utilidad
              </button>
            </div>
          </div>
        ) : null}

        {/* BUSCADOR Y BOTÓN */}
        <div className="flex items-center gap-3">
          {onSearch && (
            <div className="relative">
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black"
              />
            </div>
          )}
          <button
            className="bg-[#2B3744] hover:bg-white hover:text-[#2B3744] text-white font-medium py-2 px-4 rounded border border-[#2B3744] transition"
            onClick={() => onAdd && onAdd(null)}
          >
            Agregar
          </button>
        </div>
      </div>

      {/* TABLA */}
      <table className="w-full text-sm text-left text-gray-900">
        <thead className="text-xs uppercase bg-[#43A29E] text-white">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-6 py-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-8">
                <div className="flex justify-center items-center w-full h-full">
                  <BounceLoader color="#43A29E" size={80} />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-6 text-gray-500"
              >
                No hay registros disponibles
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const isStockRow = tipo === "stock";
              const hasProveedores =
                isStockRow && row.proveedores && row.proveedores.length > 0;
              const isExpanded = expandedRows[row.id];
              const preferido = hasProveedores
                ? getPreferido(row.proveedores)
                : null;

              // Importar helper functions desde el hook
              // Las funciones ya están importadas arriba: getValorColPorcentaje y formatCosto

              return (
                <React.Fragment key={rowIndex}>
                  {/* Fila principal */}
                  <tr className="bg-white border-b hover:bg-gray-50 transition">
                    {columns.map((col, colIndex) => (
                      <td
                        key={col.key}
                        onClick={() => handleCellClick(col, row)}
                        className={`px-6 py-4 text-gray-800 cursor-pointer hover:underline ${colIndex === 0 ? "font-medium whitespace-nowrap" : ""}`}
                      >
                        {/* Mostrar costo del preferido si existe */}
                        {isStockRow && col.key === "costo" && preferido ? (
                          <span className="text-green-600 font-semibold">
                            {formatCosto(preferido.costo)}
                          </span>
                        ) : isStockRow &&
                          col.key === "mts_ml_m2" &&
                          preferido ? (
                          <span>{formatCosto(preferido.mts_ml_m2)}</span>
                        ) : isStockRow &&
                          (col.key === "col_1" ||
                            col.key === "col_2" ||
                            col.key === "col_3") &&
                          preferido ? (
                          <span>
                            {formatCosto(
                              getValorColPorcentaje(col.key, preferido),
                            )}
                          </span>
                        ) : (
                          formatDisplayValue(row[col.key], col.key)
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Fila expandida: proveedores (solo para stock) */}
                  {isStockRow && isExpanded && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={columns.length + 1} className="px-6 py-4">
                        <div className="space-y-3">
                          {/* Header de la sub-tabla */}
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">
                              Proveedores ({row.proveedores?.length || 0})
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProveedor(row.id);
                              }}
                              className="flex items-center gap-1 bg-[#43A29E] hover:bg-[#2B3744] text-white text-xs font-medium px-3 py-1.5 rounded transition"
                            >
                              <FaPlus size={12} />
                              Agregar Proveedor
                            </button>
                          </div>

                          {/* Tabla de proveedores */}
                          {row.proveedores && row.proveedores.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs uppercase bg-[#2B3744] text-white">
                                  <th className="px-3 py-2 text-left">
                                    Proveedor
                                  </th>
                                  <th className="px-3 py-2 text-right">
                                    Costo
                                  </th>
                                  <th className="px-3 py-2 text-right">
                                    MTS/ML/M²
                                  </th>
                                  <th className="px-3 py-2 text-right">
                                    {
                                      columns.find((c) => c.key === "col_1")
                                        ?.label
                                    }
                                  </th>
                                  <th className="px-3 py-2 text-right">
                                    {
                                      columns.find((c) => c.key === "col_2")
                                        ?.label
                                    }
                                  </th>
                                  <th className="px-3 py-2 text-right">
                                    {
                                      columns.find((c) => c.key === "col_3")
                                        ?.label
                                    }
                                  </th>
                                  <th className="px-3 py-2 text-center">
                                    Preferido
                                  </th>
                                  <th className="px-3 py-2 text-center">
                                    Acciones
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.proveedores.map((sp, spIndex) => (
                                  <tr
                                    key={spIndex}
                                    className="border-b border-gray-200 hover:bg-gray-100"
                                  >
                                    <td className="px-3 py-2 font-medium text-gray-800">
                                      {sp.proveedor_nombre ||
                                        sp.proveedor?.name ||
                                        `Proveedor ${sp.proveedor}`}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700">
                                      {formatCosto(sp.costo)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700">
                                      {formatCosto(sp.mts_ml_m2)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700">
                                      {formatCosto(
                                        getValorColPorcentaje("col_1", sp),
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700">
                                      {formatCosto(
                                        getValorColPorcentaje("col_2", sp),
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700">
                                      {formatCosto(
                                        getValorColPorcentaje("col_3", sp),
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {sp.es_preferido ? (
                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                          Preferido
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">
                                          —
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <div className="flex justify-center gap-2">
                                        <button
                                          onClick={() =>
                                            handleEditProveedor({
                                              ...sp,
                                              stock: row.id,
                                            })
                                          }
                                          className="text-blue-600 hover:text-blue-800 transition p-1"
                                          title="Editar"
                                        >
                                          <FaEdit size={14} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteProveedor(
                                              sp.id,
                                              sp.proveedor_nombre ||
                                                sp.proveedor?.name,
                                            )
                                          }
                                          className="text-red-600 hover:text-red-800 transition p-1"
                                          title="Eliminar"
                                        >
                                          <FaTrash size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <p className="text-sm">
                                No hay proveedores agregados.
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddProveedor(row.id);
                                }}
                                className="mt-2 text-[#43A29E] hover:text-[#2B3744] font-medium text-sm transition"
                              >
                                + Agregar el primer proveedor
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {/* MODAL CONFIRMACIÓN */}
      <UtilityPercentagesModal
        isOpen={isUtilityModalOpen}
        onClose={() => setUtilityModalOpen(false)}
        tasaId={tasa?.id}
        currentValues={{
          utilidad_porcentaje_1: tasa?.utilidad_porcentaje_1 ?? 0,
          utilidad_porcentaje_2: tasa?.utilidad_porcentaje_2 ?? 0,
          utilidad_porcentaje_3: tasa?.utilidad_porcentaje_3 ?? 0,
        }}
        onSaved={() => {
          setUtilityModalOpen(false);
          if (tasaRefetch) tasaRefetch();
          if (refetch) refetch();
        }}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => handleDeleteClick(null, "")}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de eliminar{" "}
            <span className="font-bold text-red-700">{selectedItemName}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleDeleteClick(null, "")}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para agregar/editar proveedor */}
      <StockProveedorModal
        isOpen={isProveedorModalOpen}
        onClose={() => setProveedorModalOpen(false)}
        stockId={selectedStockId}
        stockProveedor={editingStockProveedor}
        onSaved={handleProveedorSaved}
        proveedores={proveedores}
      />
    </div>
  );
};

export default Tables;