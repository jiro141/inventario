import { useState, useEffect, useMemo, useCallback } from "react";
import useDepartamentos from "../../hooks/useDepartamentos";
import useProveedores from "../../hooks/useProveedores";
import { deleteItem, createItem, deleteStockProveedor } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";

// Helper para construir columnas dinámicas de stock basadas en la tasa
export const buildStockColumns = (tasa) => {
  const p1 = tasa?.utilidad_porcentaje_1
    ? `${Number(tasa.utilidad_porcentaje_1).toFixed(0)}%`
    : "% 1";
  const p2 = tasa?.utilidad_porcentaje_2
    ? `${Number(tasa.utilidad_porcentaje_2).toFixed(0)}%`
    : "% 2";
  const p3 = tasa?.utilidad_porcentaje_3
    ? `${Number(tasa.utilidad_porcentaje_3).toFixed(0)}%`
    : "% 3";

  return [
    { key: "codigo", label: "Código" },
    { key: "descripcion", label: "Descripción" },
    { key: "pza", label: "Pieza" },
    { key: "cantidad", label: "Cantidad" },
    { key: "costo", label: "Costo" },
    { key: "mts_ml_m2", label: "MTS/ML/M²" },
    { key: "col_1", label: p1 },
    { key: "col_2", label: p2 },
    { key: "col_3", label: p3 },
  ];
};

// Helper para obtener valor de porcentaje desde el backend
// El backend devuelve: costo_1, costo_2, costo_3
export const getValorColPorcentaje = (colKey, preferido) => {
  if (!preferido) return null;

  // Usar los valores costo_1, costo_2, costo_3 que vienen del backend
  if (colKey === "col_1")
    return preferido.costo_1 != null ? Number(preferido.costo_1) : null;
  if (colKey === "col_2")
    return preferido.costo_2 != null ? Number(preferido.costo_2) : null;
  if (colKey === "col_3")
    return preferido.costo_3 != null ? Number(preferido.costo_3) : null;

  return null;
};

// Helper para formatear costo
export const formatCosto = (value) => {
  if (value === null || value === undefined) return "—";
  return `$${parseFloat(value).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const useTables = ({
  data = [],
  loading,
  tipo,
  refetch,
  tasa,
  tasaLoading,
  tasaRefetch,
  onAdd,
  onSearch,
}) => {
  // Hooks de datos
  const { departamentos = [] } = useDepartamentos();
  const { proveedores = [] } = useProveedores();

  // Estados para modales
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [editando, setEditando] = useState(false);
  const [valorTaza, setValorTaza] = useState("");
  const [isUtilityModalOpen, setUtilityModalOpen] = useState(false);

  // Estados para accordion de proveedores
  const [expandedRows, setExpandedRows] = useState({});
  const [stockProveedoresData, setStockProveedoresData] = useState({});

  // Estados para modal de proveedor
  const [isProveedorModalOpen, setProveedorModalOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [editingStockProveedor, setEditingStockProveedor] = useState(null);

  // Estados para búsqueda
  const [query, setQuery] = useState("");

  // Columnas dinámicas para stock
  const columns = tipo === "stock" ? buildStockColumns(tasa) : [];

  // Memo para resolver IDs a nombres
  const idToName = useMemo(
    () => ({
      departamento: (id) =>
        departamentos.find((d) => d.id === id)?.name || `ID: ${id}`,
      proveedor: (id) =>
        proveedores.find((p) => p.id === id)?.name || `ID: ${id}`,
    }),
    [departamentos, proveedores],
  );

  // Effect para actualizar valorTaza cuando cambia la tasa
  useEffect(() => {
    if (tasa?.valor !== undefined && tasa?.valor !== null) {
      setValorTaza(parseFloat(tasa.valor));
    }
  }, [tasa]);

  // Effect para búsqueda con debounce
  useEffect(() => {
    if (!onSearch) return;
    const delay = setTimeout(() => onSearch(query), 500);
    return () => clearTimeout(delay);
  }, [query, onSearch]);

  // --- HANDLERS ---

  const handleDeleteClick = (id, name) => {
    setSelectedItemId(id);
    setSelectedItemName(name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = useCallback(async () => {
    try {
      await deleteItem(tipo, selectedItemId);
      refetch && refetch();
    } catch (err) {
      console.error("Error eliminando:", err);
    } finally {
      setDeleteModalOpen(false);
      setSelectedItemId(null);
    }
  }, [tipo, selectedItemId, refetch]);

  const handleGuardar = useCallback(async () => {
    try {
      const payload = { valor: valorTaza.toString() };
      await createItem("taza", payload);
      if (tasaRefetch) await tasaRefetch();
      if (refetch) await refetch();
      setTimeout(() => setEditando(false), 100);
      toast.success("Valor de tasa actualizado correctamente");
      setEditando(false);
    } catch (error) {
      console.error("Error al actualizar la tasa:", error);
      toast.error("Error al actualizar el valor de tasa");
    }
  }, [valorTaza, tasaRefetch, refetch]);

  const formatDisplayValue = useCallback((value, colKey) => {
    const resolver = idToName[colKey];
    const resolvedValue = resolver ? resolver(value) : value;
    if (resolvedValue === null || resolvedValue === undefined) return "—";
    if (typeof resolvedValue === "object")
      return JSON.stringify(resolvedValue);
    const displayText =
      typeof resolvedValue === "string" && resolvedValue.length > 15
        ? resolvedValue.slice(0, 15) + "..."
        : resolvedValue;
    const isMonetaryColumn =
      colKey === "costo" ||
      colKey === "mts_ml_m2" ||
      (colKey === "mts_ml_m2_1" && resolvedValue !== null) ||
      (colKey === "mts_ml_m2_2" && resolvedValue !== null) ||
      (colKey === "mts_ml_m2_3" && resolvedValue !== null);
    return isMonetaryColumn ? `$${resolvedValue}` : displayText;
  }, [idToName]);

  const handleCellClick = useCallback((col, row) => {
    const value = row[col.key];
    if (col.key === "telefono" && value) {
      const phone = String(value).replace(/\D/g, "");
      if (!phone) return;
      const url = `https://wa.me/${phone}`;
      window.open(url, "_blank");
      return;
    }
    if (onAdd) {
      onAdd(row);
    }
  }, [onAdd]);

  // Toggle accordion para proveedores
  const toggleExpandRow = useCallback(async (stockId) => {
    if (expandedRows[stockId]) {
      setExpandedRows((prev) => {
        const next = { ...prev };
        delete next[stockId];
        return next;
      });
    } else {
      if (!stockProveedoresData[stockId]) {
        try {
          const { getStockProveedores } =
            await import("../../api/controllers/Inventario");
          const response = await getStockProveedores(stockId);
          const proveedoresData = response.results || response || [];
          setStockProveedoresData((prev) => ({
            ...prev,
            [stockId]: proveedoresData,
          }));
        } catch (err) {
          console.error("Error cargando proveedores:", err);
          setStockProveedoresData((prev) => ({
            ...prev,
            [stockId]: [],
          }));
        }
      }
      setExpandedRows((prev) => ({ ...prev, [stockId]: true }));
    }
  }, [expandedRows, stockProveedoresData]);

  const handleAddProveedor = useCallback((stockId) => {
    setSelectedStockId(stockId);
    setEditingStockProveedor(null);
    setProveedorModalOpen(true);
  }, []);

  const handleEditProveedor = useCallback((stockProveedor) => {
    setSelectedStockId(stockProveedor.stock);
    setEditingStockProveedor(stockProveedor);
    setProveedorModalOpen(true);
  }, []);

  const handleDeleteProveedor = useCallback(async (stockProveedorId, proveedorNombre) => {
    if (!window.confirm(`¿Eliminar el proveedor "${proveedorNombre}" de este item?`)) {
      return;
    }
    try {
      await deleteStockProveedor(stockProveedorId);
      toast.success("Proveedor eliminado correctamente");
      const { getStockProveedores } = await import("../../api/controllers/Inventario");
      const response = await getStockProveedores(selectedStockId);
      const proveedoresData = response.results || response || [];
      setStockProveedoresData((prev) => ({
        ...prev,
        [selectedStockId]: proveedoresData,
      }));
    } catch (err) {
      console.error("Error eliminando proveedor:", err);
      toast.error("Error al eliminar el proveedor");
    }
  }, [selectedStockId]);

  const handleProveedorSaved = useCallback(async () => {
    if (refetch) refetch();
    if (selectedStockId) {
      const { getStockProveedores } = await import("../../api/controllers/Inventario");
      try {
        const response = await getStockProveedores(selectedStockId);
        const proveedoresData = response.results || response || [];
        setStockProveedoresData((prev) => ({
          ...prev,
          [selectedStockId]: proveedoresData,
        }));
      } catch (err) {
        console.error("Error recargando proveedores:", err);
      }
    }
  }, [refetch, selectedStockId]);

  // Buscar preferido: si hay uno marcado, usarlo; si no, usar el de mayor costo
  const getPreferido = useCallback((stockProveedores) => {
    if (!stockProveedores || stockProveedores.length === 0) return null;
    
    // Primero buscar los marcados como preferido
    const preferido = stockProveedores.find((sp) => sp.es_preferido);
    if (preferido) return preferido;
    
    // Si ninguno es preferido, devolver el de mayor costo
    return stockProveedores.reduce((max, sp) => {
      const costoActual = parseFloat(sp.costo) || 0;
      const costoMax = parseFloat(max?.costo) || 0;
      return costoActual > costoMax ? sp : max;
    }, stockProveedores[0]);
  }, []);

  // Retornar todo lo necesario para la UI
  return {
    // Datos
    columns,
    departamentos,
    proveedores,
    
    // Estados
    query,
    setQuery,
    isDeleteModalOpen,
    selectedItemId,
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
    
    // Handlers
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
    formatCosto,
  };
};

export default useTables;