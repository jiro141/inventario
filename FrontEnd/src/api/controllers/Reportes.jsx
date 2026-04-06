import AuthApi from "../AuthApi";

/**
 * Obtener todas las notas de entrega
 */
export const getNotasEntrega = async (search = "") => {
  const response = await AuthApi.get(`/reportes/notas-entrega/?search=${search}`);
  return response.data;
};

/**
 * Obtener una nota de entrega por ID
 */
export const getNotaEntrega = async (id) => {
  const response = await AuthApi.get(`/reportes/notas-entrega/${id}/`);
  return response.data;
};

/**
 * Crear una nueva nota de entrega
 */
export const createNotaEntrega = async (payload) => {
  const response = await AuthApi.post(`/reportes/notas-entrega/`, payload);
  return response.data;
};

/**
 * Actualizar una nota de entrega
 */
export const updateNotaEntrega = async (id, payload) => {
  const response = await AuthApi.put(`/reportes/notas-entrega/${id}/`, payload);
  return response.data;
};

/**
 * Aprobar una nota de entrega
 */
export const aprobarNotaEntrega = async (id) => {
  const response = await AuthApi.post(`/reportes/notas-entrega/${id}/aprobar/`);
  return response.data;
};

/**
 * Cancelar una nota de entrega
 */
export const cancelarNotaEntrega = async (id) => {
  const response = await AuthApi.post(`/reportes/notas-entrega/${id}/cancelar/`);
  return response.data;
};

/**
 * Agregar un item a una nota de entrega
 */
export const agregarItemNotaEntrega = async (notaId, payload) => {
  const response = await AuthApi.post(`/reportes/notas-entrega/${notaId}/agregar_item/`, payload);
  return response.data;
};

/**
 * Eliminar un item de una nota de entrega (usa POST para mayor compatibilidad)
 */
export const eliminarItemNotaEntrega = async (notaId, itemId) => {
  const response = await AuthApi.post(`/reportes/notas-entrega/${notaId}/eliminar_item/`, {
    item_id: itemId
  });
  return response.data;
};

/**
 * Actualizar un item de una nota de entrega
 */
export const actualizarItemNotaEntrega = async (notaId, itemId, payload) => {
  const response = await AuthApi.patch(`/reportes/notas-entrega/${notaId}/items/${itemId}/`, payload);
  return response.data;
};

// ========== CLIENTES ==========

/**
 * Obtener todos los clientes
 */
export const getClientes = async (search = "") => {
  const response = await AuthApi.get(`/reportes/clientes/?search=${search}`);
  return response.data;
};

/**
 * Obtener un cliente por ID
 */
export const getCliente = async (id) => {
  const response = await AuthApi.get(`/reportes/clientes/${id}/`);
  return response.data;
};

/**
 * Crear un nuevo cliente
 */
export const createCliente = async (payload) => {
  const response = await AuthApi.post(`/reportes/clientes/`, payload);
  return response.data;
};

/**
 * Actualizar un cliente
 */
export const updateCliente = async (id, payload) => {
  const response = await AuthApi.put(`/reportes/clientes/${id}/`, payload);
  return response.data;
};

/**
 * Eliminar un cliente (desactivar)
 */
export const deleteCliente = async (id) => {
  const response = await AuthApi.delete(`/reportes/clientes/${id}/`);
  return response.data;
};

/**
 * Generar PDF de una nota de entrega
 * @param {number} notaId - ID de la nota de entrega
 * @returns {Promise<Blob>} - Blob del PDF
 */
export const generarPdfNotaEntrega = async (notaId) => {
  const response = await AuthApi.get(`/reportes/notas-entrega/${notaId}/generar_pdf/`, {
    responseType: 'blob',
  });
  return response.data;
};