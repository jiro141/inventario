import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BounceLoader } from "react-spinners";
import { FaSearch, FaPlus, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { getClientes, createCliente, updateCliente, deleteCliente } from "../../api/controllers/Reportes";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";

const ClientesLayout = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [search, setSearch] = useState("");
  
  // Estado para modal de confirmación de eliminar
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({
    isOpen: false,
    clienteId: null,
    clienteNombre: "",
  });

  // Query para clientes
  const { data: clientesData, isLoading, refetch } = useQuery({
    queryKey: ["clientes", search],
    queryFn: () => getClientes(search),
  });

  // Mutations
  const crearMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      toast.success("Cliente creado correctamente");
      queryClient.invalidateQueries(["clientes"]);
      setModalOpen(false);
      setEditingCliente(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.cedula?.[0] || "Error al crear cliente");
    },
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCliente(id, payload),
    onSuccess: () => {
      toast.success("Cliente actualizado correctamente");
      queryClient.invalidateQueries(["clientes"]);
      setModalOpen(false);
      setEditingCliente(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.cedula?.[0] || "Error al actualizar cliente");
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      toast.success("Cliente eliminado correctamente");
      queryClient.invalidateQueries(["clientes"]);
    },
    onError: (err) => {
      toast.error("Error al eliminar cliente");
    },
  });

  // Preparar datos para la tabla
  const clientes = useMemo(() => {
    if (!clientesData) return [];
    return clientesData.results || clientesData;
  }, [clientesData]);

  // Columnas para la tabla
  const columns = [
    { key: "nombre", label: "Nombre" },
    { key: "cedula", label: "Cédula/RIF" },
    { key: "telefono", label: "Teléfono" },
    { key: "email", label: "Email" },
  ];

  const formatDisplayValue = (value, key) => {
    if (value === null || value === undefined) return "—";
    return value;
  };

  const handleCellClick = (col, row) => {
    if (col.key === "nombre") {
      setEditingCliente(row);
      setModalOpen(true);
    }
  };

  const handleAdd = () => {
    setEditingCliente(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCliente(null);
  };

  // Acciones personalizadas para cada fila
  const renderActions = (row) => {
    return (
      <div className="flex gap-2 justify-center">
        {/* Editar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingCliente(row);
            setModalOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800 p-1"
          title="Editar"
        >
          <FaEdit size={14} />
        </button>
        
        {/* Eliminar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDeleteModal({
              isOpen: true,
              clienteId: row.id,
              clienteNombre: row.nombre,
            });
          }}
          className="text-red-600 hover:text-red-800 p-1"
          title="Eliminar"
        >
          <FaTrash size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      {/* HEADER con título, buscador y botón */}
      <div className="px-6 py-4 bg-[#43A29E] border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Clientes</h2>

        {/* Buscador y botón */}
        <div className="flex items-center gap-3">
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
          <button
            className="bg-[#2B3744] hover:bg-white hover:text-[#2B3744] text-white font-medium py-2 px-4 rounded border border-[#2B3744] transition"
            onClick={handleAdd}
          >
            <FaPlus size={12} className="inline mr-1" />
            Nuevo Cliente
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
          ) : clientes.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-6 text-gray-500"
              >
                No hay clientes registrados. Crea uno nuevo para comenzar.
              </td>
            </tr>
          ) : (
            clientes.map((cliente, index) => (
              <tr
                key={cliente.id}
                className={`border-b hover:bg-gray-50 transition ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    onClick={() => handleCellClick(col, cliente)}
                    className={`px-6 py-4 text-gray-800 cursor-pointer hover:underline ${col.key === "nombre" ? "font-medium" : ""}`}
                  >
                    {formatDisplayValue(cliente[col.key], col.key)}
                  </td>
                ))}
                <td className="px-6 py-4">{renderActions(cliente)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal de cliente */}
      <ClienteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        cliente={editingCliente}
        onSaved={() => {
          refetch();
          handleCloseModal();
        }}
        crearMutation={crearMutation}
        editarMutation={editarMutation}
      />

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, clienteId: null, clienteNombre: "" })}
        onConfirm={() => {
          if (confirmDeleteModal.clienteId) {
            eliminarMutation.mutate(confirmDeleteModal.clienteId);
          }
        }}
        title="Eliminar Cliente"
        message={`¿Eliminar al cliente "${confirmDeleteModal.clienteNombre}"?`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
};

// Componente Modal para crear/editar cliente
const ClienteModal = ({ isOpen, onClose, cliente, onSaved, crearMutation, editarMutation }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    email: "",
    direccion: "",
    observaciones: "",
  });

  const isEditing = !!cliente;

  // Cargar datos del cliente al abrir
  React.useEffect(() => {
    if (isOpen) {
      if (cliente) {
        setFormData({
          nombre: cliente.nombre || "",
          cedula: cliente.cedula || "",
          telefono: cliente.telefono || "",
          email: cliente.email || "",
          direccion: cliente.direccion || "",
          observaciones: cliente.observaciones || "",
        });
      } else {
        setFormData({
          nombre: "",
          cedula: "",
          telefono: "",
          email: "",
          direccion: "",
          observaciones: "",
        });
      }
    }
  }, [isOpen, cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await editarMutation.mutateAsync({ id: cliente.id, payload: formData });
      } else {
        await crearMutation.mutateAsync(formData);
      }
      onSaved();
    } catch (err) {
      console.error("Error guardando cliente:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Cliente" : "Nuevo Cliente"}
      width="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Nombre completo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cédula / RIF *
          </label>
          <input
            type="text"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="V-12345678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="0414-1234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <textarea
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={2}
            placeholder="Dirección del cliente"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={2}
            placeholder="Observaciones..."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#43A29E] rounded-lg hover:bg-[#2B3744] disabled:opacity-50"
          >
            {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientesLayout;