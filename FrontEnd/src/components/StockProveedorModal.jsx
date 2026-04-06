import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import Select from "react-select";
import { createStockProveedor, updateStockProveedor, getStockProveedores } from "../api/controllers/Inventario";
import { toast } from "react-toastify";

/**
 * Extrae el mensaje de error de una respuesta de error de DRF (Django REST Framework)
 */
const getErrorMessage = (err) => {
  const { response } = err;

  if (!response || !response.data) {
    return err.message || "Error desconocido al guardar";
  }

  const data = response.data;

  // 1. Check for field-specific validation errors
  const fieldErrors = [];
  for (const field in data) {
    if (field !== "detail" && field !== "message" && Array.isArray(data[field])) {
      fieldErrors.push(`${field}: ${data[field].join(", ")}`);
    }
  }

  if (fieldErrors.length > 0) {
    return fieldErrors.join(". ");
  }

  // 2. Check for DRF's non-field error (detail key)
  if (data.detail) {
    return data.detail;
  }

  // 3. Check for custom API error (message key)
  if (data.message) {
    return data.message;
  }

  // 4. If it's a string, use it directly
  if (typeof data === "string") {
    return data;
  }

  // 5. Fallback: try to stringify the error object
  try {
    return JSON.stringify(data);
  } catch {
    return "Error desconocido al guardar";
  }
};

/**
 * Modal para agregar/editar un proveedor de stock
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {() => void} props.onClose - Función para cerrar el modal
 * @param {number|string} props.stockId - ID del item de stock
 * @param {Object|null} props.stockProveedor - StockProveedor a editar (null para nuevo)
 * @param {Array} props.proveedores - Lista de proveedores para el dropdown
 * @param {() => void} props.onSaved - Función llamada después de guardar exitosamente
 */
const StockProveedorModal = ({
  isOpen,
  onClose,
  stockId,
  stockProveedor = null,
  proveedores = [],
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    stock: stockId,
    proveedor: "",
    costo_pesos: "",
    costo_dolares: "",
    envio: "0",
    es_preferido: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar con datos existentes al editar
  useEffect(() => {
    if (isOpen) {
      if (stockProveedor) {
        setFormData({
          stock: stockId,
          proveedor: stockProveedor.proveedor || stockProveedor.proveedor_id || "",
          costo_pesos: stockProveedor.costo_pesos?.toString() || "",
          costo_dolares: stockProveedor.costo_dolares?.toString() || "",
          envio: stockProveedor.envio?.toString() || "0",
          es_preferido: stockProveedor.es_preferido || false,
        });
      } else {
        setFormData({
          stock: stockId,
          proveedor: "",
          costo_pesos: "",
          costo_dolares: "",
          envio: "0",
          es_preferido: false,
        });
      }
      setError(null);
    }
  }, [isOpen, stockProveedor, stockId]);

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Manejar cambios en el select de proveedor
  const handleProveedorChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      proveedor: selectedOption ? selectedOption.value : "",
    }));
  };

  // Preparar opciones para el dropdown de proveedores
  const proveedorOptions = proveedores.map((p) => ({
    label: p.name || p.nombre || `Proveedor ${p.id}`,
    value: p.id,
  }));

  // Validar formulario
  const validarFormulario = () => {
    if (!formData.proveedor) {
      return "Debe seleccionar un proveedor";
    }
    if (!formData.costo_pesos && !formData.costo_dolares) {
      return "Debe ingresar al menos un costo (pesos o dólares)";
    }
    return null;
  };

  // Manejar guardar
  const handleGuardar = async () => {
    // Validar
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar payload
      const payload = {
        stock: stockId,
        proveedor: parseInt(formData.proveedor, 10),
        es_preferido: formData.es_preferido,
      };

      // Solo incluir costos si tienen valor
      if (formData.costo_pesos && formData.costo_pesos.trim() !== "") {
        payload.costo_pesos = parseFloat(formData.costo_pesos);
      }
      if (formData.costo_dolares && formData.costo_dolares.trim() !== "") {
        payload.costo_dolares = parseFloat(formData.costo_dolares);
      }
      if (formData.envio && formData.envio.trim() !== "") {
        payload.envio = parseFloat(formData.envio);
      }

      // Crear o actualizar
      if (stockProveedor && stockProveedor.id) {
        await updateStockProveedor(stockProveedor.id, payload);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await createStockProveedor(payload);
        toast.success("Proveedor agregado correctamente");
      }

      // Notificar y cerrar
      if (onSaved) onSaved();
      onClose();

    } catch (err) {
      console.error("Error al guardar stock-proveedor:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error("Error al guardar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cancelar
  const handleCancelar = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stockProveedor ? "Editar Proveedor" : "Agregar Proveedor"}
      width="max-w-lg"
    >
      {/* Grid de campos */}
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Proveedor */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <Select
              name="proveedor"
              options={proveedorOptions}
              value={proveedorOptions.find((opt) => opt.value === formData.proveedor) || null}
              onChange={handleProveedorChange}
              placeholder="Buscar proveedor..."
              isClearable
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          {/* Costo en Pesos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo en Pesos
            </label>
            <input
              type="number"
              name="costo_pesos"
              value={formData.costo_pesos}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {/* Costo en Dólares */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo en Dólares
            </label>
            <input
              type="number"
              name="costo_dolares"
              value={formData.costo_dolares}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {/* Envío */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Envío / Flete
            </label>
            <input
              type="number"
              name="envio"
              value={formData.envio}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {/* Preferido */}
          <div className="lg:col-span-3 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <input
              type="checkbox"
              name="es_preferido"
              id="es_preferido"
              checked={formData.es_preferido}
              onChange={handleChange}
              className="w-4 h-4 text-[#43A29E] border-gray-300 rounded focus:ring-[#43A29E]"
            />
            <label htmlFor="es_preferido" className="text-sm font-medium text-gray-700">
              Establecer como proveedor preferido
            </label>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancelar}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#43A29E] transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-4 py-2 text-sm font-medium text-white bg-[#43A29E] border border-transparent rounded-lg hover:bg-[#2B3744] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#43A29E] transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Guardando...
              </>
            ) : (
              stockProveedor ? "Actualizar" : "Agregar"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StockProveedorModal;
