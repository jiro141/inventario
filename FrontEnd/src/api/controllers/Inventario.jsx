import AuthApi from "../AuthApi";

/**
 * Obtener todos los elementos de Stock
 * @returns {Promise<Array>} Lista de stock
 */
export const getStock = async (search = "") => {
  const response = await AuthApi.get(`/inventario/stock/?search=${search}`);
  return response.data;
};

export const getTaza = async () => {
  const response = await AuthApi.get(`/inventario/taza/`);
  return response.data;
};

export const getMovimientos = async (search = "") => {
  const response = await AuthApi.get(
    `/inventario/movimientos/?search=${search}`
  );
  return response.data;
};

export const getProveedores = async (search = "") => {
  const response = await AuthApi.get(
    `/inventario/proveedores/?search=${search}`
  );
  return response.data;
};

/**
 * Crear un nuevo elemento (genérico)
 * @param {string} tipo - 'stock'
 * @param {Object} payload - datos a enviar
 */
export const createItem = async (tipo, payload) => {
  const response = await AuthApi.post(`/inventario/${tipo}/`, payload);
  return response.data;
};

/**
 * Actualizar un elemento por ID
 * @param {string} tipo
 * @param {number|string} id
 * @param {Object} payload
 */
export const updateItem = async (tipo, id, payload) => {
  const response = await AuthApi.put(`/inventario/${tipo}/${id}/`, payload);
  return response.data;
};

/**
 * Eliminar un elemento por ID
 * @param {string} tipo
 * @param {number|string} id
 */
export const deleteItem = async (tipo, id) => {
  const response = await AuthApi.delete(`/inventario/${tipo}/${id}/`);
  return response.data;
};

/**
 * Obtener un solo elemento por ID
 * @param {string} tipo
 * @param {number|string} id
 */
export const getItemById = async (tipo, id) => {
  const response = await AuthApi.get(`/inventario/${tipo}/${id}/`);
  return response.data;
};

/**
 * Obtener proveedores con búsqueda opcional
 * @param {string} search
 */
export const getProveedoresSearch = async (search = "") => {
  const response = await AuthApi.get(
    `/inventario/proveedores/?search=${search}`
  );
  return response.data;
};

/**
 * Actualizar parcialmente los porcentajes de utilidad globales en Taza (PATCH)
 * @param {number|string} tazaId — ID del registro Taza_pesos_dolares activo
 * @param {Object} payload — { utilidad_porcentaje_1, utilidad_porcentaje_2, utilidad_porcentaje_3 }
 */
export const patchTazaPorcentajes = async (tazaId, payload) => {
  const response = await AuthApi.patch(`/inventario/taza/${tazaId}/porcentajes/`, payload);
  return response.data;
};

/**
 * Obtener StockProveedores de un item de stock
 * GET /inventario/stock-proveedores/?stock=id
 * @param {number|string} stockId — ID del stock
 * @returns {Promise<Array>} Lista de stock-proveedores
 */
export const getStockProveedores = async (stockId) => {
  const response = await AuthApi.get(`/inventario/stock-proveedores/?stock=${stockId}`);
  return response.data;
};

/**
 * Crear StockProveedor
 * POST /inventario/stock-proveedores/
 * @param {Object} payload — datos del stock-proveedor
 * @returns {Promise<Object>} StockProveedor creado
 */
export const createStockProveedor = async (payload) => {
  const response = await AuthApi.post(`/inventario/stock-proveedores/`, payload);
  return response.data;
};

/**
 * Actualizar StockProveedor
 * PATCH /inventario/stock-proveedores/{id}/
 * @param {number|string} id — ID del stock-proveedor
 * @param {Object} payload — datos a actualizar
 * @returns {Promise<Object>} StockProveedor actualizado
 */
export const updateStockProveedor = async (id, payload) => {
  const response = await AuthApi.patch(`/inventario/stock-proveedores/${id}/`, payload);
  return response.data;
};

/**
 * Eliminar StockProveedor
 * DELETE /inventario/stock-proveedores/{id}/
 * @param {number|string} id — ID del stock-proveedor
 */
export const deleteStockProveedor = async (id) => {
  const response = await AuthApi.delete(`/inventario/stock-proveedores/${id}/`);
  return response.data;
};

/**
 * Obtener historial de precios de un StockProveedor
 * GET /inventario/precio-historia/?stock_proveedor=id
 * @param {number|string} stockProveedorId — ID del stock-proveedor
 * @returns {Promise<Array>} Lista de historial de precios
 */
export const getPrecioHistoria = async (stockProveedorId) => {
  const response = await AuthApi.get(`/inventario/precio-historia/?stock_proveedor=${stockProveedorId}`);
  return response.data;
};
