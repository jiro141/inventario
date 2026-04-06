import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Select from "react-select";
import { useQueryClient } from "@tanstack/react-query";
import useProveedores from "../../hooks/useProveedores";
import useDepartamentos from "../../hooks/useDepartamentos";
import {
  createItem,
  updateItem,
  createStockProveedor,
  updateStockProveedor,
  deleteStockProveedor,
  getStockProveedores,
} from "../../api/controllers/Inventario";
import { toast } from "react-toastify";

const StockModal = ({
  isOpen,
  onClose,
  stockItem,
  departamentos,
  onSaved,
  onDeptCreated,
}) => {
  const isEditing = Boolean(stockItem && stockItem.id);
  const { proveedores, refetch: refetchProveedores } = useProveedores();
  const { refetch: refetchDepartamentos } = useDepartamentos();
  const queryClient = useQueryClient();

  // ── Estado del formulario ──────────────────────────────
  const [stockForm, setStockForm] = useState({
    codigo: "",
    descripcion: "",
    departamento: "",
    pza: "",
    cantidad: "",
    factor_conversion: "",
  });

  const [proveedorForm, setProveedorForm] = useState({
    proveedor: "",
    costo_pesos: "",
    costo_dolares: "",
    envio: "0",
    es_preferido: false,
  });

  // ID del stock recién creado (para encadenar proveedores)
  const [createdStockId, setCreatedStockId] = useState(null);

  // Lista de proveedores ya asociados (para editar)
  const [proveedoresList, setProveedoresList] = useState([]);

  // Edición inline de un proveedor existente
  const [editingSpId, setEditingSpId] = useState(null);
  const [editingSpForm, setEditingSpForm] = useState({});

  // Modal separado para crear nuevo proveedor
  const [isQuickAddProveedorModalOpen, setQuickAddProveedorModalOpen] = useState(false);
  const [quickAddProveedorForm, setQuickAddProveedorForm] = useState({
    name: "",
    direccion: "",
    telefono: "",
    encargado: "",
  });

  // Modal para crear nuevo departamento
  const [isQuickAddDeptModalOpen, setQuickAddDeptModalOpen] = useState(false);
  const [quickAddDeptForm, setQuickAddDeptForm] = useState({
    name: "",
  });

  // Modal para lista de proveedores asociados
  const [isListaProveedoresModalOpen, setListaProveedoresModalOpen] = useState(false);
  const [editandoSpId, setEditandoSpId] = useState(null);
  const [editandoSpForm, setEditandoSpForm] = useState({});

  const [loading, setLoading] = useState(false);

  // ── Efecto para refrescar proveedores cuando se cierra el modal de nuevo proveedor ──
  const [proveedorModalWasOpen, setProveedorModalWasOpen] = useState(false);
  useEffect(() => {
    // Detectamos el cambio de abierto a cerrado
    if (proveedorModalWasOpen && !isQuickAddProveedorModalOpen) {
      refetchProveedores();
    }
    setProveedorModalWasOpen(isQuickAddProveedorModalOpen);
  }, [isQuickAddProveedorModalOpen, proveedorModalWasOpen]);

  // ── Efecto para refrescar departamentos cuando se cierra el modal de nuevo departamento ──
  const [deptModalWasOpen, setDeptModalWasOpen] = useState(false);
  useEffect(() => {
    // Detectamos el cambio de abierto a cerrado
    if (deptModalWasOpen && !isQuickAddDeptModalOpen) {
      refetchDepartamentos();
    }
    setDeptModalWasOpen(isQuickAddDeptModalOpen);
  }, [isQuickAddDeptModalOpen, deptModalWasOpen]);

  // ── Inicializar al abrir ──────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // SIEMPRE resetear el formulario de proveedor al abrir el modal
      setProveedorForm({
        proveedor: "",
        costo_pesos: "",
        costo_dolares: "",
        envio: "0",
        es_preferido: false,
      });
      
      if (isEditing) {
        // Editar stock existente
        setStockForm({
          codigo: stockItem.codigo || "",
          descripcion: stockItem.descripcion || "",
          departamento: stockItem.departamento || "",
          pza: stockItem.pza || "",
          cantidad: stockItem.cantidad || "",
          factor_conversion: stockItem.factor_conversion || "",
        });
        setCreatedStockId(stockItem.id);
        setProveedoresList(stockItem.proveedores || []);
      } else {
        // Nuevo stock
        setStockForm({
          codigo: "",
          descripcion: "",
          departamento: "",
          pza: "",
          cantidad: "",
          factor_conversion: "",
        });
        setCreatedStockId(null);
        setProveedoresList([]);
      }
      setEditingSpId(null);
      setEditingSpForm({});
    }
  }, [isOpen, stockItem, isEditing]);

  // ── Handlers ──────────────────────────────────────────
  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProveedorChange = (selected) => {
    if (selected) {
      const selectedProveedorId = parseInt(selected.value, 10);
      
      // Buscar el proveedor seleccionado en la lista de StockProveedores del stock actual
      // comparando con proveedor.id o proveedor_id
      const sp = proveedoresList.find(p => 
        p.proveedor === selectedProveedorId || 
        p.proveedor_id === selectedProveedorId
      );
      
      if (sp) {
        // Ya existe un StockProveedor para este stock con ese proveedor
        // Mostrar los datos pero indicar que se va a actualizar, no crear nuevo
        setProveedorForm((prev) => ({
          ...prev,
          proveedor: selected.value,
          costo_pesos: sp.costo_pesos || "",
          costo_dolares: sp.costo_dolares || "",
          envio: sp.envio || "0",
          es_preferido: sp.es_preferido || false,
        }));
      } else {
        // Es un proveedor nuevo para este stock
        setProveedorForm((prev) => ({
          ...prev,
          proveedor: selected.value,
          costo_pesos: "",
          costo_dolares: "",
          envio: "0",
          es_preferido: false,
        }));
      }
    } else {
      setProveedorForm((prev) => ({
        ...prev,
        proveedor: "",
        costo_pesos: "",
        costo_dolares: "",
        envio: "0",
        es_preferido: false,
      }));
    }
  };

  const handleProveedorFieldChange = (e) => {
    const { name, type, checked, value } = e.target;
    setProveedorForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Quick add provider - manejar cambio de campos (nuevo proveedor)
  const handleQuickAddProveedorChange = (e) => {
    const { name, value } = e.target;
    setQuickAddProveedorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Quick add provider - crear nuevo proveedor (no StockProveedor)
  const handleQuickAddProveedorSave = async () => {
    if (!quickAddProveedorForm.name.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: quickAddProveedorForm.name.trim(),
        direccion: quickAddProveedorForm.direccion.trim() || null,
        telefono: quickAddProveedorForm.telefono.trim() || null,
        encargado: quickAddProveedorForm.encargado.trim() || null,
      };
      await createItem("proveedores", payload);
      toast.success("Proveedor creado correctamente");
      setQuickAddProveedorModalOpen(false);
      setQuickAddProveedorForm({
        name: "",
        direccion: "",
        telefono: "",
        encargado: "",
      });
      // Refrescar la lista de proveedores para que aparezca el nuevo
      refetchProveedores();
      // Invalidar la query global de proveedores para que se actualice en toda la app
      queryClient.invalidateQueries(["proveedores"]);
    } catch (err) {
      console.error("Error quick add proveedor:", err);
      toast.error("Error al crear proveedor");
    } finally {
      setLoading(false);
    }
  };

  // Quick add departamento - manejar cambio de campos
  const handleQuickAddDeptChange = (e) => {
    const { name, value } = e.target;
    setQuickAddDeptForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Quick add departamento - crear nuevo departamento
  const handleQuickAddDeptSave = async () => {
    if (!quickAddDeptForm.name.trim()) {
      toast.error("El nombre del departamento es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: quickAddDeptForm.name.trim(),
      };
      await createItem("departamentos", payload);
      toast.success("Departamento creado correctamente");
      setQuickAddDeptModalOpen(false);
      setQuickAddDeptForm({ name: "" });
      // Refrescar la lista de departamentos
      refetchDepartamentos();
      // Notificar al padre para que también refresque si es necesario
      if (onDeptCreated) onDeptCreated();
    } catch (err) {
      console.error("Error quick add departamento:", err);
      toast.error("Error al crear departamento");
    } finally {
      setLoading(false);
    }
  };

  // Editar proveedor desde el modal de lista
  const iniciarEdicionSp = (sp) => {
    setEditandoSpId(sp.id);
    setEditandoSpForm({
      proveedor: sp.proveedor || sp.proveedor_id || "",
      costo_pesos: sp.costo_pesos || "",
      costo_dolares: sp.costo_dolares || "",
      envio: sp.envio || "0",
      es_preferido: sp.es_preferido || false,
    });
  };

  const cancelarEdicionSp = () => {
    setEditandoSpId(null);
    setEditandoSpForm({});
  };

  const guardarEdicionSp = async (spId) => {
    if (!editandoSpForm.costo_pesos && !editandoSpForm.costo_dolares) {
      toast.error("Ingresa al menos un costo");
      return;
    }
    setLoading(true);
    try {
      const provPayload = {
        stock: createdStockId,
        proveedor: parseInt(editandoSpForm.proveedor, 10),
        es_preferido: editandoSpForm.es_preferido,
        costo_pesos: editandoSpForm.costo_pesos ? parseFloat(editandoSpForm.costo_pesos) : null,
        costo_dolares: editandoSpForm.costo_dolares ? parseFloat(editandoSpForm.costo_dolares) : null,
        envio: editandoSpForm.envio ? parseFloat(editandoSpForm.envio) : null,
      };
      await updateStockProveedor(spId, provPayload);
      toast.success("Proveedor actualizado");
      setEditandoSpId(null);
      setEditandoSpForm({});
      await cargarProveedores();
    } catch (err) {
      console.error("Error actualizando proveedor:", err);
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const eliminarSp = async (spId, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await deleteStockProveedor(spId);
      toast.success("Proveedor eliminado");
      await cargarProveedores();
    } catch (err) {
      console.error("Error eliminando:", err);
      toast.error("Error al eliminar");
    }
  };

  const handleSpFieldChange = (e) => {
    const { name, type, checked, value } = e.target;
    setEditingSpForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSpProveedorChange = (selected) => {
    setEditingSpForm((prev) => ({
      ...prev,
      proveedor: selected ? selected.value : "",
    }));
  };

  const limpiarProveedorForm = () => {
    setProveedorForm({
      proveedor: "",
      costo_pesos: "",
      costo_dolares: "",
      envio: "0",
      es_preferido: false,
    });
  };

  const cargarProveedores = async () => {
    if (createdStockId) {
      try {
        const res = await getStockProveedores(createdStockId);
        const data = res.results || res || [];
        setProveedoresList(data);
      } catch (err) {
        console.error("Error cargando proveedores:", err);
      }
    }
  };

  // Validar stock
  const validarStock = () => {
    if (!stockForm.codigo.trim()) return "El código es obligatorio";
    if (!stockForm.descripcion.trim()) return "La descripción es obligatoria";
    if (!stockForm.departamento) return "El departamento es obligatorio";
    return null;
  };

  // Validar proveedor
  const validarProveedor = () => {
    if (!proveedorForm.proveedor) return "Selecciona un proveedor";
    if (!proveedorForm.costo_pesos && !proveedorForm.costo_dolares)
      return "Ingresa al menos un costo (pesos o dólares)";
    return null;
  };

  // ── Crear / Actualizar stock (PATCH solo si hay cambios) ─────────────────────
  const crearOActualizarStock = async () => {
    const payload = {
      codigo: stockForm.codigo.trim(),
      descripcion: stockForm.descripcion.trim(),
      departamento: parseInt(stockForm.departamento, 10),
      pza: stockForm.pza.trim(),
      cantidad: stockForm.cantidad ? parseInt(stockForm.cantidad, 10) : 0,
      factor_conversion: stockForm.factor_conversion
        ? parseFloat(stockForm.factor_conversion)
        : null,
    };

    if (isEditing && createdStockId) {
      // Solo hacer PATCH si hay cambios en los datos del stock
      await updateItem("stock", createdStockId, payload);
      return createdStockId;
    } else {
      const res = await createItem("stock", payload);
      const newId = res.id;
      setCreatedStockId(newId);
      return newId;
    }
  };

  // ── Crear nuevo proveedor (solo POST, no actualizar existentes) ─────────────────────
  const crearNuevoProveedor = async (stockId) => {
    const provPayload = {
      proveedor: parseInt(proveedorForm.proveedor, 10),
      es_preferido: proveedorForm.es_preferido,
      costo_pesos: proveedorForm.costo_pesos
        ? parseFloat(proveedorForm.costo_pesos)
        : null,
      costo_dolares: proveedorForm.costo_dolares
        ? parseFloat(proveedorForm.costo_dolares)
        : null,
      envio: proveedorForm.envio
        ? parseFloat(proveedorForm.envio)
        : null,
    };
    
    const payload = {
      stock: stockId,
      ...provPayload,
    };
    
    await createStockProveedor(payload);
  };

  // ── Actualizar proveedor existente (PUT) ─────────────────────
  const actualizarProveedor = async (spId, stockId) => {
    const provPayload = {
      proveedor: parseInt(proveedorForm.proveedor, 10),
      es_preferido: proveedorForm.es_preferido,
      costo_pesos: proveedorForm.costo_pesos
        ? parseFloat(proveedorForm.costo_pesos)
        : null,
      costo_dolares: proveedorForm.costo_dolares
        ? parseFloat(proveedorForm.costo_dolares)
        : null,
      envio: proveedorForm.envio
        ? parseFloat(proveedorForm.envio)
        : null,
    };
    
    const payload = {
      stock: stockId,
      ...provPayload,
    };
    
    await updateStockProveedor(spId, payload);
  };

  // ── Enviar (stock + proveedor, cierra) ───────────────
  const handleEnviar = async () => {
    const errStock = validarStock();
    if (errStock) {
      toast.error(errStock);
      return;
    }
    const errProv = validarProveedor();
    if (errProv) {
      toast.error(errProv);
      return;
    }

    setLoading(true);
    try {
      // Primero crear/actualizar el stock y obtener su ID
      const stockId = await crearOActualizarStock();

      // Si hay un proveedor seleccionado en el formulario
      if (proveedorForm.proveedor) {
        // Verificar si ya existe para este stock
        const existingSp = proveedoresList.find(
          p => p.proveedor === parseInt(proveedorForm.proveedor, 10) || 
               p.proveedor_id === parseInt(proveedorForm.proveedor, 10)
        );
        
        if (existingSp) {
          // Actualizar el proveedor existente
          await actualizarProveedor(existingSp.id, stockId);
        } else {
          // Crear un nuevo proveedor
          await crearNuevoProveedor(stockId);
        }
      }

      toast.success(
        isEditing
          ? "Cambios guardados correctamente"
          : "Stock y proveedor creados correctamente"
      );
      if (onSaved) onSaved();
      // Invalidar queries de inventario para que se actualice en toda la app
      queryClient.invalidateQueries(["inventario"]);
      onClose();
    } catch (err) {
      console.error("Error al guardar:", err);
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  // ── Agregar otro proveedor (sin cerrar) ──────────────
  const handleAgregarOtro = async () => {
    const errStock = validarStock();
    if (errStock) {
      toast.error(errStock);
      return;
    }
    const errProv = validarProveedor();
    if (errProv) {
      toast.error(errProv);
      return;
    }

    setLoading(true);
    try {
      // Obtener o crear el stock
      let stockId = createdStockId;
      if (!stockId) {
        stockId = await crearOActualizarStock();
      }

      // Verificar si ya existe para este stock
      const existingSp = proveedoresList.find(
        p => p.proveedor === parseInt(proveedorForm.proveedor, 10) || 
             p.proveedor_id === parseInt(proveedorForm.proveedor, 10)
      );
      
      if (existingSp) {
        // Actualizar el proveedor existente
        await actualizarProveedor(existingSp.id, stockId);
        toast.success("Proveedor actualizado correctamente");
      } else {
        // Crear nuevo proveedor
        await crearNuevoProveedor(stockId);
        toast.success("Proveedor agregado correctamente");
      }
      
      limpiarProveedorForm();
      await cargarProveedores();
    } catch (err) {
      console.error("Error al agregar proveedor:", err);
      toast.error("Error al agregar proveedor");
    } finally {
      setLoading(false);
    }
  };

  // ── Editar proveedor inline ───────────────────────────
  const handleStartEditSp = (sp) => {
    setEditingSpId(sp.id);
    setEditingSpForm({
      proveedor: sp.proveedor || sp.proveedor_id || "",
      costo_pesos: sp.costo_pesos || "",
      costo_dolares: sp.costo_dolares || "",
      envio: sp.envio || "0",
      es_preferido: sp.es_preferido || false,
    });
  };

  const handleCancelEditSp = () => {
    setEditingSpId(null);
    setEditingSpForm({});
  };

  const handleSaveEditSp = async (spId) => {
    const errProv = validarProveedor();
    if (errProv) {
      toast.error(errProv);
      return;
    }
    setLoading(true);
    try {
      const provPayload = {
        proveedor: parseInt(editingSpForm.proveedor, 10),
        es_preferido: editingSpForm.es_preferido,
        costo_pesos: editingSpForm.costo_pesos
          ? parseFloat(editingSpForm.costo_pesos)
          : null,
        costo_dolares: editingSpForm.costo_dolares
          ? parseFloat(editingSpForm.costo_dolares)
          : null,
        envio: editingSpForm.envio
          ? parseFloat(editingSpForm.envio)
          : null,
      };
      await actualizarProveedor(spId, createdStockId);
      toast.success("Proveedor actualizado");
      setEditingSpId(null);
      setEditingSpForm({});
      await cargarProveedores();
    } catch (err) {
      console.error("Error actualizando proveedor:", err);
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  // ── Eliminar proveedor ────────────────────────────────
  const handleDeleteSp = async (spId, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await deleteStockProveedor(spId);
      toast.success("Proveedor eliminado");
      await cargarProveedores();
    } catch (err) {
      console.error("Error eliminando:", err);
      toast.error("Error al eliminar");
    }
  };

  const formatCosto = (v) => {
    if (!v) return "—";
    return `$${parseFloat(v).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const proveedorOptions = proveedores.map((p) => ({
    label: p.name || `Proveedor ${p.id}`,
    value: p.id,
  }));

  const deptOptions = departamentos.map((d) => ({
    label: d.name,
    value: d.id,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing ? "Editar Item de Stock" : "Nuevo Item de Stock"
      }
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {/* ── Etapa 1: Datos del item ── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Datos del Item
          </h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                name="codigo"
                value={stockForm.codigo}
                onChange={handleStockChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="TORN-001"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción <span className="text-red-500">*</span>
              </label>
              <input
                name="descripcion"
                value={stockForm.descripcion}
                onChange={handleStockChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder='Tornillo hexagonal 1/2"'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento <span className="text-red-500">*</span>
              </label>
              <Select
                name="departamento"
                options={deptOptions}
                value={deptOptions.find((o) => o.value === stockForm.departamento) || null}
                onChange={(opt) =>
                  setStockForm((prev) => ({
                    ...prev,
                    departamento: opt ? opt.value : "",
                  }))
                }
                placeholder="Seleccionar..."
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pieza / Unidad
              </label>
              <input
                name="pza"
                value={stockForm.pza}
                onChange={handleStockChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Unidad"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                name="cantidad"
                type="number"
                value={stockForm.cantidad}
                onChange={handleStockChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factor MTS / ML / M²
              </label>
              <input
                name="factor_conversion"
                type="number"
                value={stockForm.factor_conversion}
                onChange={handleStockChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Ej: 2.5"
                step="0.0001"
                min="0"
              />
            </div>
          </div>
        </div>



        {/* ── Etapa 2: Datos del proveedor ── */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {isEditing ? "Agregar Otro Proveedor" : "Datos del Proveedor"}
            </h3>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <Select
                name="proveedor"
                options={proveedorOptions}
                value={proveedorOptions.find((o) => o.value === proveedorForm.proveedor) || null}
                onChange={handleProveedorChange}
                placeholder="Buscar proveedor..."
                isClearable
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo en Pesos
              </label>
              <input
                name="costo_pesos"
                type="number"
                value={proveedorForm.costo_pesos}
                onChange={handleProveedorFieldChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo en Dólares
              </label>
              <input
                name="costo_dolares"
                type="number"
                value={proveedorForm.costo_dolares}
                onChange={handleProveedorFieldChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Envío / Flete
              </label>
              <input
                name="envio"
                type="number"
                value={proveedorForm.envio}
                onChange={handleProveedorFieldChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="es_preferido"
                id="es_preferido_main"
                checked={proveedorForm.es_preferido}
                onChange={handleProveedorFieldChange}
                className="w-4 h-4 text-[#43A29E] border-gray-300 rounded focus:ring-[#43A29E]"
              />
              <label htmlFor="es_preferido_main" className="ml-2 text-sm font-medium text-gray-700">
                Proveedor preferido
              </label>
            </div>
          </div>
        </div>

        {/* ── Botones ── */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setQuickAddDeptModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-[#2B3744] border border-[#2B3744] rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            + Nuevo Departamento
          </button>
          <button
            type="button"
            onClick={() => setQuickAddProveedorModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-[#43A29E] border border-[#43A29E] rounded-lg hover:bg-teal-50"
            disabled={loading}
          >
            + Nuevo Proveedor
          </button>
          {isEditing && createdStockId && (
            <button
              type="button"
              onClick={() => {
                cargarProveedores();
                setListaProveedoresModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium text-[#43A29E] border border-[#43A29E] rounded-lg hover:bg-teal-50"
              disabled={loading}
            >
              Lista de Proveedores
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            className="px-6 py-2 text-sm font-medium text-white bg-[#43A29E] border border-transparent rounded-lg hover:bg-[#2B3744]"
            disabled={loading}
          >
            {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Enviar"}
          </button>
        </div>
      </div>

      {/* Modal rápido para crear nuevo proveedor */}
      <Modal
        isOpen={isQuickAddProveedorModalOpen}
        onClose={() => setQuickAddProveedorModalOpen(false)}
        title="Nuevo Proveedor"
        width="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              value={quickAddProveedorForm.name}
              onChange={handleQuickAddProveedorChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Nombre del proveedor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              name="direccion"
              type="text"
              value={quickAddProveedorForm.direccion}
              onChange={handleQuickAddProveedorChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Dirección del proveedor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              name="telefono"
              type="text"
              value={quickAddProveedorForm.telefono}
              onChange={handleQuickAddProveedorChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Teléfono de contacto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encargado
            </label>
            <input
              name="encargado"
              type="text"
              value={quickAddProveedorForm.encargado}
              onChange={handleQuickAddProveedorChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Persona de contacto"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setQuickAddProveedorModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleQuickAddProveedorSave}
              className="px-4 py-2 text-sm font-medium text-white bg-[#43A29E] rounded-lg hover:bg-[#2B3744]"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Crear Proveedor"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de lista de proveedores asociados */}
      <Modal
        isOpen={isListaProveedoresModalOpen}
        onClose={() => {
          setListaProveedoresModalOpen(false);
          setEditandoSpId(null);
          setEditandoSpForm({});
        }}
        title="Proveedores Asociados"
        width="max-w-2xl"
      >
        <div className="space-y-3">
          {proveedoresList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay proveedores asociados</p>
          ) : (
            proveedoresList.map((sp) => (
              <div
                key={sp.id}
                className={`border rounded-lg p-4 ${
                  editandoSpId === sp.id ? "border-[#43A29E] bg-teal-50" : "border-gray-200 bg-white"
                }`}
              >
                {editandoSpId === sp.id ? (
                  // Modo edición
                  <div className="space-y-3">
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Costo Pesos</label>
                        <input
                          name="costo_pesos"
                          type="number"
                          value={editandoSpForm.costo_pesos}
                          onChange={(e) => setEditandoSpForm((prev) => ({ ...prev, costo_pesos: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Costo USD</label>
                        <input
                          name="costo_dolares"
                          type="number"
                          value={editandoSpForm.costo_dolares}
                          onChange={(e) => setEditandoSpForm((prev) => ({ ...prev, costo_dolares: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Envío</label>
                        <input
                          name="envio"
                          type="number"
                          value={editandoSpForm.envio}
                          onChange={(e) => setEditandoSpForm((prev) => ({ ...prev, envio: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="es_preferido"
                          id={`edit-lista-${sp.id}`}
                          checked={editandoSpForm.es_preferido}
                          onChange={(e) => setEditandoSpForm((prev) => ({ ...prev, es_preferido: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`edit-lista-${sp.id}`} className="ml-2 text-sm font-medium text-gray-700">
                          Preferido
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelarEdicionSp}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => guardarEdicionSp(sp.id)}
                        className="px-3 py-1.5 text-sm bg-[#43A29E] text-white rounded-md hover:bg-[#2B3744]"
                        disabled={loading}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo lectura
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {sp.es_preferido && (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          ★ Preferido
                        </span>
                      )}
                      <span className="font-semibold text-base text-gray-800">
                        {sp.proveedor_nombre || `Proveedor ${sp.proveedor}`}
                      </span>
                      <span className="text-base text-gray-600 font-medium">
                        {formatCosto(sp.costo)}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => iniciarEdicionSp(sp)}
                        className="text-gray-600 hover:text-[#43A29E]"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminarSp(sp.id, sp.proveedor_nombre)}
                        className="text-gray-600 hover:text-red-600"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            type="button"
            onClick={() => {
              setListaProveedoresModalOpen(false);
              setEditandoSpId(null);
              setEditandoSpForm({});
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {/* Modal rápido para crear nuevo departamento */}
      <Modal
        isOpen={isQuickAddDeptModalOpen}
        onClose={() => setQuickAddDeptModalOpen(false)}
        title="Nuevo Departamento"
        width="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              value={quickAddDeptForm.name}
              onChange={handleQuickAddDeptChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Nombre del departamento"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setQuickAddDeptModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleQuickAddDeptSave}
              className="px-4 py-2 text-sm font-medium text-white bg-[#43A29E] rounded-lg hover:bg-[#2B3744]"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Crear Departamento"}
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default StockModal;
