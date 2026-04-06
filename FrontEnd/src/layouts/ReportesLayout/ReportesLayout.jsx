import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BounceLoader } from "react-spinners";
import { FaSearch, FaPlus, FaEye, FaCheck, FaTimes, FaBan, FaFilePdf } from "react-icons/fa";
import { toast } from "react-toastify";
import { getNotasEntrega, aprobarNotaEntrega, cancelarNotaEntrega, generarPdfNotaEntrega } from "../../api/controllers/Reportes";
import NotaEntregaModal from "./NotaEntregaModal";
import ConfirmModal from "../../components/ConfirmModal";

const ReportesLayout = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingNota, setEditingNota] = useState(null);
  const [search, setSearch] = useState("");
  
  // Estados para modales de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'aprobar' | 'cancelar' | 'eliminar'
    notaId: null,
    message: "",
  });

  // Query para notas de entrega
  const { data: notasData, isLoading, refetch } = useQuery({
    queryKey: ["notas-entrega", search],
    queryFn: () => getNotasEntrega(search),
  });

  // Mutations
  const aprobarMutation = useMutation({
    mutationFn: aprobarNotaEntrega,
    onSuccess: () => {
      toast.success("Nota de entrega aprobada");
      queryClient.invalidateQueries(["notas-entrega"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Error al aprobar");
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: cancelarNotaEntrega,
    onSuccess: () => {
      toast.success("Nota de entrega cancelada");
      queryClient.invalidateQueries(["notas-entrega"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Error al cancelar");
    },
  });

  // Mutation para generar PDF
  const generarPdfMutation = useMutation({
    mutationFn: generarPdfNotaEntrega,
    onSuccess: (blob) => {
      // Crear un enlace para descargar el PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'nota_entrega.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF descargado");
    },
    onError: (err) => {
      toast.error("Error al generar PDF");
    },
  });

  // Preparar datos para la tabla
  const notas = useMemo(() => {
    if (!notasData) return [];
    return notasData.results || notasData;
  }, [notasData]);

  // Columnas para la tabla
  const columns = [
    { key: "numero", label: "Número" },
    { key: "fecha_creacion", label: "Fecha" },
    { key: "cliente_nombre", label: "Cliente" },
    { key: "estado_display", label: "Estado" },
    { key: "total_dolares", label: "Total ($)" },
  ];

  const formatDisplayValue = (value, key) => {
    if (value === null || value === undefined) return "—";
    
    if (key === "total_dolares") {
      return `$${parseFloat(value).toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
    }
    
    if (key === "estado_display") {
      const estado = value.toLowerCase();
      let colorClass = "";
      if (estado === "pendiente") colorClass = "bg-yellow-100 text-yellow-800";
      else if (estado === "aprobada") colorClass = "bg-green-100 text-green-800";
      else if (estado === "cancelada") colorClass = "bg-red-100 text-red-800";
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{value}</span>;
    }
    
    if (key === "fecha_creacion") {
      const date = new Date(value);
      return date.toLocaleDateString("es-VE");
    }
    
    return value;
  };

  // Click en cualquier celda abre el modal
  const handleCellClick = (col, row) => {
    setEditingNota(row);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingNota(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingNota(null);
  };

  const handleNotaSaved = () => {
    refetch();
    handleCloseModal();
  };

  // Acciones personalizadas para cada fila
  const renderActions = (row) => {
    return (
      <div className="flex gap-3 justify-center">
        {/* Ver/Editar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingNota(row);
            setModalOpen(true);
          }}
          className="text-[#43A29E] hover:text-[#2B3744] p-1"
          title="Ver/Editar"
        >
          <FaEye size={16} />
        </button>
        
        {/* Aprobar (solo si está pendiente) */}
        {row.estado === "pendiente" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmModal({
                isOpen: true,
                type: 'aprobar',
                notaId: row.id,
                message: "¿Aprobar esta nota de entrega? Se descontará del inventario.",
              });
            }}
            className="text-green-600 hover:text-green-800 p-1"
            title="Aprobar"
          >
            <FaCheck size={16} />
          </button>
        )}
        
        {/* Cancelar (solo si está pendiente) */}
        {row.estado === "pendiente" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmModal({
                isOpen: true,
                type: 'cancelar',
                notaId: row.id,
                message: "¿Cancelar esta nota de entrega? Los items serán liberados.",
              });
            }}
            className="text-red-500 hover:text-red-700 p-1"
            title="Cancelar"
          >
            <FaBan size={16} />
          </button>
        )}
        
        {/* Generar PDF */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            generarPdfMutation.mutate(row.id);
          }}
          className="text-red-600 hover:text-red-800 p-1"
          title="Descargar PDF"
          disabled={generarPdfMutation.isPending}
        >
          <FaFilePdf size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      {/* HEADER con título, buscador y botón */}
      <div className="px-6 py-4 bg-[#43A29E] border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Notas de Entrega</h2>

        {/* Buscador y botón */}
        <div className="flex items-center gap-3">
          {(
            <div className="relative">
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black"
              />
            </div>
          )}
          <button
            className="bg-[#2B3744] hover:bg-white hover:text-[#2B3744] text-white font-medium py-2 px-4 rounded border border-[#2B3744] transition"
            onClick={handleAdd}
          >
            <FaPlus size={12} className="inline mr-1" />
            Nueva Nota
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
            <th className="px-6 py-3 text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-8">
                <div className="flex justify-center items-center w-full h-full">
                  <BounceLoader color="#43A29E" size={80} />
                </div>
              </td>
            </tr>
          ) : notas.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-6 text-gray-500"
              >
                No hay notas de entrega. Crea una nueva para comenzar.
              </td>
            </tr>
          ) : (
            notas.map((nota, index) => (
              <tr
                key={nota.id}
                className={`border-b hover:bg-gray-50 transition ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    onClick={() => handleCellClick(col, nota)}
                    className={`px-6 py-4 text-gray-800 cursor-pointer hover:underline ${col.key === "numero" ? "font-medium" : ""}`}
                  >
                    {formatDisplayValue(nota[col.key], col.key)}
                  </td>
                ))}
                <td className="px-6 py-4">{renderActions(nota)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal */}
      <NotaEntregaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        nota={editingNota}
        onSaved={handleNotaSaved}
      />

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          if (confirmModal.type === 'aprobar') {
            toast.info("Aprobando nota de entrega...");
            aprobarMutation.mutate(confirmModal.notaId);
          } else if (confirmModal.type === 'cancelar') {
            toast.info("Cancelando nota de entrega...");
            cancelarMutation.mutate(confirmModal.notaId);
          }
        }}
        title={confirmModal.type === 'aprobar' ? "Aprobar Nota" : "Cancelar Nota"}
        message={confirmModal.message}
        confirmText={confirmModal.type === 'aprobar' ? "Aprobar" : "Cancelar Nota"}
        type={confirmModal.type === 'aprobar' ? "info" : "warning"}
      />
    </div>
  );
};

export default ReportesLayout;