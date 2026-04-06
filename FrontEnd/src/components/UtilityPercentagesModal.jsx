import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { patchTazaPorcentajes } from "../api/controllers/Inventario";
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
  const fieldErrors = [];
  for (const field in data) {
    if (field !== "detail" && field !== "message" && Array.isArray(data[field])) {
      fieldErrors.push(`${field}: ${data[field].join(", ")}`);
    }
  }
  
  if (fieldErrors.length > 0) {
    return fieldErrors.join(". ");
  }
  
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (typeof data === "string") return data;
  
  try {
    return JSON.stringify(data);
  } catch {
    return "Error desconocido al guardar";
  }
};

/**
 * Modal para editar los tres porcentajes de utilidad globales
 */
const UtilityPercentagesModal = ({
  isOpen,
  onClose,
  tasaId,
  currentValues = {},
  onSaved,
}) => {
  const [valores, setValores] = useState({
    utilidad_porcentaje_1: "",
    utilidad_porcentaje_2: "",
    utilidad_porcentaje_3: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar valores cuando cambie currentValues o se abra el modal
  useEffect(() => {
    if (isOpen) {
      setValores({
        utilidad_porcentaje_1: currentValues.utilidad_porcentaje_1?.toString() ?? "",
        utilidad_porcentaje_2: currentValues.utilidad_porcentaje_2?.toString() ?? "",
        utilidad_porcentaje_3: currentValues.utilidad_porcentaje_3?.toString() ?? "",
      });
    }
  }, [isOpen, currentValues]);

  // Manejar cambio de campo
  const handleChange = (campo, valor) => {
    if (valor === "" || /^\d*\.?\d{0,2}$/.test(valor)) {
      setValores(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
  };

  // Validar un valor de porcentaje
  const validarPorcentaje = (valor) => {
    if (valor === "") return { valido: true, valor: 0 };
    const num = parseFloat(valor);
    if (isNaN(num)) return { valido: false, mensaje: "Debe ser un número" };
    if (num < 0) return { valido: false, mensaje: "No puede ser negativo" };
    if (num > 999.99) return { valido: false, mensaje: "No puede ser mayor a 999.99" };
    return { valido: true, valor: num };
  };

  // Validar todos los campos
  const validarFormulario = () => {
    const errores = [];
    const p1 = validarPorcentaje(valores.utilidad_porcentaje_1);
    const p2 = validarPorcentaje(valores.utilidad_porcentaje_2);
    const p3 = validarPorcentaje(valores.utilidad_porcentaje_3);
    
    if (!p1.valido) errores.push(`Porcentaje 1: ${p1.mensaje}`);
    if (!p2.valido) errores.push(`Porcentaje 2: ${p2.mensaje}`);
    if (!p3.valido) errores.push(`Porcentaje 3: ${p3.mensaje}`);
    
    return errores;
  };

  // Manejar guardar
  const handleGuardar = async () => {
    if (!tasaId) {
      setError("No se puede guardar: ID de tasa no disponible");
      return;
    }

    const errores = validarFormulario();
    if (errores.length > 0) {
      setError(errores.join(". "));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        utilidad_porcentaje_1: valores.utilidad_porcentaje_1 === "" ? 0 : parseFloat(valores.utilidad_porcentaje_1),
        utilidad_porcentaje_2: valores.utilidad_porcentaje_2 === "" ? 0 : parseFloat(valores.utilidad_porcentaje_2),
        utilidad_porcentaje_3: valores.utilidad_porcentaje_3 === "" ? 0 : parseFloat(valores.utilidad_porcentaje_3),
      };

      await patchTazaPorcentajes(tasaId, payload);
      toast.success("Porcentajes de utilidad actualizados correctamente");
      
      if (onSaved) onSaved();
      onClose();
      
    } catch (err) {
      console.error("Error al actualizar porcentajes de utilidad:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset error when values change
  useEffect(() => {
    setError(null);
  }, [valores]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Porcentajes de Utilidad" width="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Ingrese los porcentajes de utilidad global. Estos se aplicarán a todos los productos.
        </p>

        {/* Porcentaje 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Porcentaje 1 (%)
          </label>
          <input
            type="text"
            value={valores.utilidad_porcentaje_1}
            onChange={(e) => handleChange("utilidad_porcentaje_1", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Ej: 10"
          />
        </div>

        {/* Porcentaje 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Porcentaje 2 (%)
          </label>
          <input
            type="text"
            value={valores.utilidad_porcentaje_2}
            onChange={(e) => handleChange("utilidad_porcentaje_2", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Ej: 15"
          />
        </div>

        {/* Porcentaje 3 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Porcentaje 3 (%)
          </label>
          <input
            type="text"
            value={valores.utilidad_porcentaje_3}
            onChange={(e) => handleChange("utilidad_porcentaje_3", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Ej: 25"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-4 py-2 text-sm font-medium text-white bg-[#43A29E] rounded-lg hover:bg-[#2B3744] disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UtilityPercentagesModal;