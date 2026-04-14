import React, { useState, useEffect, useMemo } from "react";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import Select from "react-select";
import { FaPlus, FaTrash, FaBoxOpen, FaUserPlus, FaEdit, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { createNotaEntrega, getNotaEntrega, agregarItemNotaEntrega, eliminarItemNotaEntrega, actualizarItemNotaEntrega, aprobarNotaEntrega, cancelarNotaEntrega, getClientes, createCliente } from "../../api/controllers/Reportes";
import { getTaza } from "../../api/controllers/Inventario";
import ItemSelectionModal from "./ItemSelectionModal";

const NotaEntregaModal = ({ isOpen, onClose, nota, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [utilidadPorcentajes, setUtilidadPorcentajes] = useState({
    utilidad_porcentaje_1: 0,
    utilidad_porcentaje_2: 0,
    utilidad_porcentaje_3: 0,
  });
  
  // Estados para modales de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'eliminar' | 'aprobar' | 'cancelar'
    itemId: null,
    message: "",
  });
  
  // Lista de clientes
  const [clientesOptions, setClientesOptions] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Datos del cliente (manual)
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteCedula, setClienteCedula] = useState("");
  const [observaciones, setObservaciones] = useState("");
  
  // Items locales (antes de crear la nota)
  const [localItems, setLocalItems] = useState([]);
  
  // Modal de selección de items
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  
  // Modal de crear cliente
  const [isCreateClienteModalOpen, setCreateClienteModalOpen] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    email: "",
  });
  const [savingCliente, setSavingCliente] = useState(false);
  
  // Estado de la nota en backend
  const [notaId, setNotaId] = useState(null);
  const [notaEstado, setNotaEstado] = useState("pendiente");
  const [notaItems, setNotaItems] = useState([]);

  const isEditing = !!nota;
  const isNuevaNota = !notaId && !isEditing;
  // isReadOnly debe actualizarse cuando cambia notaEstado
  // Para nuevas notas (isNuevaNota = true), siempre editable
  // Para notas existentes, solo editable si está pendiente
  const isReadOnly = !isNuevaNota && notaEstado !== "pendiente";

  // Cargar taza al abrir
  useEffect(() => {
    if (isOpen) {
      cargarTaza();
    }
  }, [isOpen]);

  const cargarTaza = async () => {
    try {
      const taza = await getTaza();
      if (taza) {
        setUtilidadPorcentajes({
          utilidad_porcentaje_1: parseFloat(taza.utilidad_porcentaje_1) || 0,
          utilidad_porcentaje_2: parseFloat(taza.utilidad_porcentaje_2) || 0,
          utilidad_porcentaje_3: parseFloat(taza.utilidad_porcentaje_3) || 0,
        });
      }
    } catch (err) {
      console.error("Error cargando taza:", err);
    }
  };

  // Resetear formulario al abrir
  useEffect(() => {
    if (isOpen) {
      cargarClientes();
      
      // Función para cargar los datos de la nota desde el backend
      const cargarNota = async () => {
        if (nota && nota.id) {
          try {
            // Siempre recargar del backend para tener datos frescos
            const notaActualizada = await getNotaEntrega(nota.id);
            setNotaId(notaActualizada.id);
            const estado = notaActualizada.estado || "pendiente";
            setNotaEstado(estado);
            
            // Cargar cliente si existe
            if (notaActualizada.cliente) {
              setSelectedCliente({
                value: notaActualizada.cliente,
                label: notaActualizada.cliente_nombre_display || "",
              });
            } else {
              setSelectedCliente(null);
            }
            
            setClienteNombre(notaActualizada.cliente_nombre || "");
            setClienteCedula(notaActualizada.cliente_cedula || "");
            setObservaciones(notaActualizada.observaciones || "");
            setNotaItems(notaActualizada.items || []);
            setLocalItems([]);
          } catch (err) {
            console.error("Error recargando nota:", err);
            // Si falla, usar los datos del prop
            setNotaId(nota.id);
            const estado = nota.estado || "pendiente";
            setNotaEstado(estado);
            
            if (nota.cliente) {
              setSelectedCliente({
                value: nota.cliente,
                label: nota.cliente_nombre_display || "",
              });
            } else {
              setSelectedCliente(null);
            }
            
            setClienteNombre(nota.cliente_nombre || "");
            setClienteCedula(nota.cliente_cedula || "");
            setObservaciones(nota.observaciones || "");
            setNotaItems(nota.items || []);
            setLocalItems([]);
          }
        } else {
          // Nueva nota
          resetForm();
        }
      };
      
      cargarNota();
    }
  }, [isOpen, nota]);

  const cargarClientes = async () => {
    try {
      const data = await getClientes();
      const clientes = data.results || data;
      setClientesOptions(
        clientes.map((c) => ({
          value: c.id,
          label: `${c.nombre} (${c.cedula})`,
          data: c,
        }))
      );
    } catch (err) {
      console.error("Error cargando clientes:", err);
    }
  };

  const resetForm = () => {
    setNotaId(null);
    setNotaEstado("pendiente");
    setSelectedCliente(null);
    setClienteNombre("");
    setClienteCedula("");
    setObservaciones("");
    setLocalItems([]);
    setNotaItems([]);
    setNuevoCliente({ nombre: "", cedula: "", telefono: "", email: "" });
  };

  // Crear un nuevo cliente desde el modal
  const handleCreateCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.cedula) {
      toast.error("Nombre y Cédula son obligatorios");
      return;
    }

    setSavingCliente(true);
    try {
      const clienteCreado = await createCliente(nuevoCliente);
      toast.success("Cliente creado correctamente");
      
      // Agregar el nuevo cliente a las opciones y seleccionarlo
      const nuevoOption = {
        value: clienteCreado.id,
        label: `${clienteCreado.nombre} (${clienteCreado.cedula})`,
        data: clienteCreado,
      };
      setClientesOptions([...clientesOptions, nuevoOption]);
      setSelectedCliente(nuevoOption);
      setClienteNombre(clienteCreado.nombre);
      setClienteCedula(clienteCreado.cedula);
      
      setCreateClienteModalOpen(false);
      setNuevoCliente({ nombre: "", cedula: "", telefono: "", email: "" });
    } catch (err) {
      console.error("Error creando cliente:", err);
      toast.error(err.response?.data?.cedula?.[0] || "Error al crear cliente");
    } finally {
      setSavingCliente(false);
    }
  };

  // Cuando se selecciona un cliente, autocompletar datos
  useEffect(() => {
    if (selectedCliente && selectedCliente.data) {
      const cliente = selectedCliente.data;
      setClienteNombre(cliente.nombre || "");
      setClienteCedula(cliente.cedula || "");
    }
  }, [selectedCliente]);

  // Cuando se confirman los items desde el modal de selección
  const handleItemsConfirmed = (items) => {
    // Agregar los nuevos items a la lista local
    setLocalItems([...localItems, ...items]);
    toast.success(`${items.length} item(s) agregado(s)`);
  };

  // Eliminar item de la lista local
  const handleEliminarItemLocal = (tempId) => {
    setLocalItems(localItems.filter((item) => item.tempId !== tempId));
  };

  // Editar item (both local and backend)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemForm, setEditingItemForm] = useState({});
  // Necesitamos acceso a los proveedores del stock para el dropdown
  const [editingItemStockProveedores, setEditingItemStockProveedores] = useState([]);

  const handleStartEditItem = (item) => {
    setEditingItemId(item.id || item.tempId);
    setEditingItemForm({
      cantidad: item.cantidad,
      cual_costo: item.cual_costo,
      tipo_venta: item.tipo_venta || 'cantidad',
      stock_proveedor: item.stock_proveedor,
    });
    // Guardar los proveedores del stock para el dropdown
    if (item.stock_proveedores) {
      setEditingItemStockProveedores(item.stock_proveedores);
    } else if (item.stock && item.stock.proveedores) {
      setEditingItemStockProveedores(item.stock.proveedores);
    } else {
      setEditingItemStockProveedores([]);
    }
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemForm({});
    setEditingItemStockProveedores([]);
  };

  const handleSaveEditItem = async () => {
    if (!editingItemId) return;

    // Si es un item local (sin guardar en backend)
    if (!notaId) {
      setLocalItems(localItems.map((item) => {
        if (item.tempId === editingItemId) {
          return { ...item, ...editingItemForm };
        }
        return item;
      }));
      setEditingItemId(null);
      setEditingItemForm({});
      toast.success("Item actualizado");
      return;
    }

    // Si es un item del backend
    // Buscar el item real (con id, no tempId)
    const itemOriginal = notaItems.find(i => i.id === editingItemId);
    if (!itemOriginal) {
      toast.error("Item no encontrado");
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        cantidad: editingItemForm.cantidad,
        cual_costo: editingItemForm.cual_costo,
        tipo_venta: editingItemForm.tipo_venta || 'cantidad',
      };
      
      // Solo enviar stock_proveedor si cambió
      if (editingItemForm.stock_proveedor && editingItemForm.stock_proveedor !== itemOriginal.stock_proveedor) {
        updatePayload.stock_proveedor = editingItemForm.stock_proveedor;
      }
      
      await actualizarItemNotaEntrega(notaId, editingItemId, updatePayload);
      
      // Actualizar el estado local
      setNotaItems(notaItems.map(item => {
        if (item.id === editingItemId) {
          return { ...item, ...editingItemForm };
        }
        return item;
      }));
      
      setEditingItemId(null);
      setEditingItemForm({});
      toast.success("Item actualizado");
    } catch (err) {
      console.error("Error actualizando item:", err);
      toast.error("Error al actualizar el item");
    } finally {
      setLoading(false);
    }
  };

  // Crear la nota con todos los items locales
  const handleCrearNota = async () => {
    if (localItems.length === 0) {
      toast.error("Agrega al menos un item");
      return;
    }

    setLoading(true);
    try {
      const notaPayload = {
        cliente: selectedCliente ? selectedCliente.value : null,
        cliente_nombre: !selectedCliente ? clienteNombre : null,
        cliente_cedula: !selectedCliente ? clienteCedula : null,
        observaciones: observaciones || null,
        items: localItems.map((item) => ({
          stock: item.stock,
          stock_proveedor: item.stock_proveedor,
          cantidad: item.cantidad,
          cual_costo: item.cual_costo,
          tipo_venta: item.tipo_venta || 'cantidad',
        })),
      };

      const nuevaNota = await createNotaEntrega(notaPayload);
      
      // Recargar la nota completa para obtener los items con todos los datos
      const notaCompleta = await getNotaEntrega(nuevaNota.id);
      
      setNotaId(notaCompleta.id);
      setNotaEstado(notaCompleta.estado);
      setNotaItems(notaCompleta.items || []);
      setLocalItems([]);
      
      toast.success("Nota de entrega creada");
      onSaved && onSaved();
    } catch (err) {
      console.error("Error creando nota:", err);
      toast.error(err.response?.data?.error || "Error al crear la nota");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarItem = (itemId) => {
    if (!notaId) return;
    
    setConfirmModal({
      isOpen: true,
      type: 'eliminar',
      itemId: itemId,
      message: "¿Eliminar este item de la nota de entrega?",
    });
  };

  const executeEliminarItem = async () => {
    setLoading(true);
    try {
      await eliminarItemNotaEntrega(notaId, confirmModal.itemId);
      const notaActualizada = await getNotaEntrega(notaId);
      setNotaItems(notaActualizada.items || []);
      toast.success("Item eliminado");
    } catch (err) {
      console.error("Error eliminando item:", err);
      toast.error("Error al eliminar item");
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = () => {
    if (!notaId) return;
    
    setConfirmModal({
      isOpen: true,
      type: 'aprobar',
      itemId: null,
      message: "¿Aprobar esta nota de entrega? Se descontará del inventario.",
    });
  };

  const executeAprobar = async () => {
    try {
      await aprobarNotaEntrega(notaId);
      toast.success("Nota aprobada");
      onSaved && onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al aprobar");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    if (!notaId) return;
    
    setConfirmModal({
      isOpen: true,
      type: 'cancelar',
      itemId: null,
      message: "¿Cancelar esta nota de entrega? Los items serán liberados.",
    });
  };

  const executeCancelar = async () => {
    try {
      await cancelarNotaEntrega(notaId);
      toast.success("Nota cancelada");
      onSaved && onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cancelar");
    }
  };

  // Determinar qué lista mostrar (local o del backend)
  const displayItems = notaId ? notaItems : localItems;
  const handleEliminarItemFn = notaId ? handleEliminarItem : handleEliminarItemLocal;

  // Calcular total
  const total = displayItems.reduce((sum, item) => {
    return sum + (parseFloat(item.precio_unitario_dolares) * item.cantidad);
  }, 0);

  // Formatear costo para mostrar
  const formatCosto = (cualCosto) => {
    const labels = {
      costo_1: `${utilidadPorcentajes.utilidad_porcentaje_1}%`,
      costo_2: `${utilidadPorcentajes.utilidad_porcentaje_2}%`,
      costo_3: `${utilidadPorcentajes.utilidad_porcentaje_3}%`,
    };
    return labels[cualCosto] || cualCosto;
  };

  // Opciones de costo dinámicas para el selector
  const costoOptions = useMemo(() => {
    const options = [];
    if (utilidadPorcentajes.utilidad_porcentaje_1 > 0) {
      options.push({ value: "costo_1", label: `${utilidadPorcentajes.utilidad_porcentaje_1}%` });
    }
    if (utilidadPorcentajes.utilidad_porcentaje_2 > 0) {
      options.push({ value: "costo_2", label: `${utilidadPorcentajes.utilidad_porcentaje_2}%` });
    }
    if (utilidadPorcentajes.utilidad_porcentaje_3 > 0) {
      options.push({ value: "costo_3", label: `${utilidadPorcentajes.utilidad_porcentaje_3}%` });
    }
    if (options.length === 0) {
      options.push({ value: "costo_1", label: "Costo 1" });
      options.push({ value: "costo_2", label: "Costo 2" });
      options.push({ value: "costo_3", label: "Costo 3" });
    }
    return options;
  }, [utilidadPorcentajes]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Nota de Entrega ${nota?.numero}` : isNuevaNota ? "Nueva Nota de Entrega" : `Nota de Entrega #${notaId}`}
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Datos del cliente - solo editable en nuevas notas */}
        <div className="space-y-4">
          {!isNuevaNota && nota && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Cliente:</p>
              <p className="text-gray-900">
                {nota.cliente_nombre_display || nota.cliente_nombre || "—"}
                {nota.cliente_cedula && <span className="text-gray-500 ml-2">({nota.cliente_cedula})</span>}
              </p>
            </div>
          )}
          
          {isNuevaNota && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <Select
                  options={clientesOptions}
                  value={selectedCliente}
                  onChange={(option) => {
                    setSelectedCliente(option);
                    if (!option) {
                      setClienteNombre("");
                      setClienteCedula("");
                    }
                  }}
                  placeholder="Seleccionar cliente registrado..."
                  isClearable
                  isDisabled={isReadOnly}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setCreateClienteModalOpen(true)}
                  className="mt-6 bg-[#43A29E] hover:bg-[#2B3744] text-white p-2 rounded-md transition"
                  title="Crear nuevo cliente"
                >
                  <FaUserPlus size={16} />
                </button>
              )}
            </div>
          )}

          {isNuevaNota && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  disabled={isReadOnly || !!selectedCliente}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula / RIF
                </label>
                <input
                  type="text"
                  value={clienteCedula}
                  onChange={(e) => setClienteCedula(e.target.value)}
                  disabled={isReadOnly || !!selectedCliente}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Cédula o RIF"
                />
              </div>
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            disabled={isReadOnly}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={2}
            placeholder="Observaciones..."
          />
        </div>

        {/* Lista de items o mensaje vacío */}
        {displayItems.length > 0 ? (
          <>
            {/* Header con título y botón */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Ferretería
                </h3>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setItemModalOpen(true)}
                    className="flex items-center gap-2 bg-[#43A29E] hover:bg-[#2B3744] text-white px-3 py-2 rounded-md text-sm transition"
                  >
                    <FaPlus size={12} />
                    Agregar Ferretería
                  </button>
                )}
              </div>
            </div>

            {/* Tabla de items */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Items ({displayItems.length})</h3>
              <div className="max-h-64 overflow-y-auto my-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-2 py-2 text-left">Código</th>
                      <th className="px-2 py-2 text-left">Descripción</th>
                      <th className="px-2 py-2 text-left">Proveedor</th>
                      <th className="px-2 py-2 text-center">Costo</th>
                      <th className="px-2 py-2 text-center">Tipo Venta</th>
                      <th className="px-2 py-2 text-center">Cantidad</th>
                      <th className="px-2 py-2 text-center">Equivalente</th>
                      <th className="px-2 py-2 text-right">Precio</th>
                      <th className="px-2 py-2 text-right">Total</th>
                      {!isReadOnly && <th className="px-2 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((item) => {
                      const isEditingThis = editingItemId === (item.id || item.tempId);
                      const providers = isEditingThis && editingItemId === (item.id || item.tempId) 
                        ? editingItemStockProveedores 
                        : (item.stock_proveedores || (item.stock && item.stock.proveedores) || []);
                      
                      // Calcular equivalente MTS/ML/M²/KG
                      const factor = item.stock_factor_conversion || item.factor_conversion || 1;
                      const cantidad = item.cantidad || 0;
                      const equivalente = cantidad * factor;
                      const unidadEquivalente = item.stock_pza || 'MTS';
                      
                      return (
                      <tr key={item.id || item.tempId} className="border-b">
                        <td className="px-2 py-2 font-medium">{item.stock_codigo}</td>
                        <td className="px-2 py-2">{item.stock_descripcion}</td>
                        <td className="px-2 py-2">
                          {isEditingThis ? (
                            <select
                              value={editingItemForm.stock_proveedor || ""}
                              onChange={(e) => setEditingItemForm({ ...editingItemForm, stock_proveedor: parseInt(e.target.value) })}
                              className="border rounded px-2 py-1 text-xs w-32"
                            >
                              <option value="">Seleccionar...</option>
                              {providers.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.proveedor_nombre || `Proveedor ${p.proveedor}`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            item.proveedor_nombre
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {isEditingThis ? (
                            <select
                              value={editingItemForm.cual_costo}
                              onChange={(e) => setEditingItemForm({ ...editingItemForm, cual_costo: e.target.value })}
                              className="border rounded px-2 py-1 text-xs"
                            >
                              {costoOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                              {formatCosto(item.cual_costo)}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {isEditingThis ? (
                            <select
                              value={editingItemForm.tipo_venta || 'cantidad'}
                              onChange={(e) => setEditingItemForm({ ...editingItemForm, tipo_venta: e.target.value })}
                              className="border rounded px-2 py-1 text-xs"
                            >
                              <option value="cantidad">Cantidad</option>
                              <option value="mts_ml_m2">MTS/ML/M²</option>
                            </select>
                          ) : (
                            <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                              {item.tipo_venta === 'mts_ml_m2' ? 'MTS/ML/M²' : 'Cantidad'}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              min="1"
                              value={editingItemForm.cantidad}
                              onChange={(e) => setEditingItemForm({ ...editingItemForm, cantidad: parseInt(e.target.value) || 0 })}
                              className="border rounded px-2 py-1 w-20 text-center"
                            />
                          ) : (
                            <span className="text-xs">{cantidad}</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {equivalente.toFixed(factor % 1 === 0 ? 0 : 2)} {unidadEquivalente}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right">${item.precio_unitario_dolares}</td>
                        <td className="px-2 py-2 text-right font-medium">
                          ${(parseFloat(item.precio_unitario_dolares) * item.cantidad).toFixed(2)}
                        </td>
                        {!isReadOnly && (
                          <td className="px-2 py-2 text-center">
                            {isEditingThis ? (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={handleSaveEditItem}
                                  className="text-green-600 hover:text-green-800"
                                  title="Guardar"
                                >
                                  <FaPlus size={12} />
                                </button>
                                <button
                                  onClick={handleCancelEditItem}
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Cancelar"
                                >
                                  <FaTimes size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => handleStartEditItem(item)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Editar"
                                >
                                  <FaEdit size={12} />
                                </button>
                                <button
                                  onClick={() => handleEliminarItemFn(item.id || item.tempId)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Eliminar"
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              
              {/* Total */}
              <div className="mt-3 text-right">
                <span className="text-lg font-bold text-gray-800">
                  Total: ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 border-t">
            <FaBoxOpen size={40} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No hay items agregados</p>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setItemModalOpen(true)}
                className="mt-2 text-[#43A29E] hover:text-[#2B3744] font-medium text-sm"
              >
                + Agregar ferretería
              </button>
            )}
          </div>
        )}

        {/* Botón crear nota (solo cuando hay items locales y no hay notaId) */}
        {isNuevaNota && localItems.length > 0 && (
          <div className="flex justify-center pt-4 border-t">
            <button
              type="button"
              onClick={handleCrearNota}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-[#43A29E] rounded-lg hover:bg-[#2B3744] disabled:opacity-50"
            >
              Crear Nota de Entrega
            </button>
          </div>
        )}

        {/* Botones de acción (cuando hay nota creada) */}
        {notaId && (
          <div className="flex justify-between pt-4 border-t">
            <div>
              {notaEstado === "pendiente" && (
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                >
                  Cancelar Nota
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
              {notaEstado === "pendiente" && (
                <button
                  type="button"
                  onClick={handleAprobar}
                  disabled={loading || displayItems.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Aprobar Nota
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de selección de items */}
      <ItemSelectionModal
        isOpen={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onConfirm={handleItemsConfirmed}
        items={localItems}
      />

      {/* Modal para crear nuevo cliente */}
      <Modal
        isOpen={isCreateClienteModalOpen}
        onClose={() => {
          setCreateClienteModalOpen(false);
          setNuevoCliente({ nombre: "", cedula: "", telefono: "", email: "" });
        }}
        title="Nuevo Cliente"
        width="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cédula / RIF *
            </label>
            <input
              type="text"
              value={nuevoCliente.cedula}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, cedula: e.target.value })}
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
              value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
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
              value={nuevoCliente.email}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setCreateClienteModalOpen(false);
                setNuevoCliente({ nombre: "", cedula: "", telefono: "", email: "" });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateCliente}
              disabled={savingCliente}
              className="px-4 py-2 text-sm font-medium text-white bg-[#43A29E] rounded-lg hover:bg-[#2B3744] disabled:opacity-50"
            >
              {savingCliente ? "Guardando..." : "Crear Cliente"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          if (confirmModal.type === 'eliminar') {
            toast.info("Eliminando item...");
            executeEliminarItem();
          } else if (confirmModal.type === 'aprobar') {
            setLoading(true);
            toast.info("Aprobando nota de entrega...");
            executeAprobar();
          } else if (confirmModal.type === 'cancelar') {
            toast.info("Cancelando nota de entrega...");
            executeCancelar();
          }
        }}
        title={
          confirmModal.type === 'eliminar' ? "Eliminar Item" :
          confirmModal.type === 'aprobar' ? "Aprobar Nota" : "Cancelar Nota"
        }
        message={confirmModal.message}
        confirmText={
          confirmModal.type === 'eliminar' ? "Eliminar" :
          confirmModal.type === 'aprobar' ? "Aprobar" : "Cancelar Nota"
        }
        type={
          confirmModal.type === 'eliminar' ? 'danger' :
          confirmModal.type === 'aprobar' ? 'info' : 'warning'
        }
      />
    </Modal>
  );
};

export default NotaEntregaModal;