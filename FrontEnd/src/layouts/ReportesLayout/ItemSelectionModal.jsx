import React, { useState, useEffect, useMemo } from "react";
import Modal from "../../components/Modal";
import Select from "react-select";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import { getStock } from "../../api/controllers/Inventario";
import { getTaza } from "../../api/controllers/Inventario";

// Modal para seleccionar items de ferretería - una sola tabla con cantidad para seleccionar
const ItemSelectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  items: existingItems = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [search, setSearch] = useState("");
  const [utilidadPorcentajes, setUtilidadPorcentajes] = useState({
    utilidad_porcentaje_1: 0,
    utilidad_porcentaje_2: 0,
    utilidad_porcentaje_3: 0,
  });

  // Items con su configuración (cada item tiene su propio estado)
  const [itemsConfig, setItemsConfig] = useState({});

  // Cargar stock y taza al abrir
  useEffect(() => {
    if (isOpen) {
      cargarStock();
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

  const cargarStock = async () => {
    setLoading(true);
    try {
      const data = await getStock();
      const stocks = data.results || data;
      setStockData(stocks);

      // Inicializar configuración para cada item
      const initialConfig = {};
      stocks.forEach((stock) => {
        const existingItem = existingItems.find((e) => e.stock === stock.id);
        if (existingItem) {
          initialConfig[stock.id] = {
            stock_proveedor: existingItem.stock_proveedor,
            cual_costo: existingItem.cual_costo,
            cantidad: existingItem.cantidad,
            precio_unitario_dolares: existingItem.precio_unitario_dolares,
            tipo_venta: existingItem.tipo_venta || 'cantidad',
          };
        } else if (stock.proveedores && stock.proveedores.length > 0) {
          // Valores por defecto
          initialConfig[stock.id] = {
            stock_proveedor: stock.proveedores[0]?.id || null,
            cual_costo: "costo_1",
            cantidad: 0,
            precio_unitario_dolares: stock.proveedores[0]?.costo_1 || 0,
            tipo_venta: 'cantidad',
          };
        }
      });
      setItemsConfig(initialConfig);
    } catch (err) {
      console.error("Error cargando stock:", err);
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  // Actualizar la configuración de un item
  const handleUpdateItem = (stockId, field, value) => {
    const stock = stockData.find((s) => s.id === stockId);
    if (!stock) return;

    setItemsConfig((prev) => {
      const itemConfig = { ...prev[stockId] };
      itemConfig[field] = value;

      // Si cambió el proveedor o el costo, recalcular precio
      if (field === "stock_proveedor" || field === "cual_costo") {
        const prov = stock.proveedores?.find(
          (p) =>
            p.id ===
            (field === "stock_proveedor" ? value : itemConfig.stock_proveedor),
        );
        if (prov) {
          if (field === "cual_costo") {
            itemConfig.precio_unitario_dolares = prov[value] || 0;
          }
        }
      }

      // Si cambió el tipo de venta, recalcular precio unitario para mostrar
      if (field === "tipo_venta") {
        const prov = stock.proveedores?.find(
          (p) => p.id === itemConfig.stock_proveedor,
        );
        if (prov) {
          const precioBase = prov[itemConfig.cual_costo] || prov.costo || 0;
          if (value === 'mts_ml_m2' && stock.factor_conversion && stock.factor_conversion > 0) {
            itemConfig.precio_unitario_dolares = precioBase / stock.factor_conversion;
            // Convertir cantidad a equivalente
            itemConfig.cantidad = itemConfig.cantidad * stock.factor_conversion;
          } else {
            itemConfig.precio_unitario_dolares = precioBase;
            // Restaurar cantidad original
            itemConfig.cantidad = itemConfig.cantidad / stock.factor_conversion;
          }
        }
      }

      return { ...prev, [stockId]: itemConfig };
    });
  };

  // Obtener los items que tienen cantidad > 0
  const getSelectedItems = () => {
    const selectedItems = [];

    stockData.forEach((stock) => {
      const config = itemsConfig[stock.id];
      if (config && config.cantidad > 0 && config.stock_proveedor) {
        const factor = stock.factor_conversion || 1;
        // Si es mts_ml_m2, la cantidad ya viene como equivalente, hay que dividirla para obtener la cantidad real
        const cantidadReal = config.tipo_venta === 'mts_ml_m2' 
          ? Math.floor(config.cantidad / factor) 
          : config.cantidad;
        
        selectedItems.push({
          tempId: Date.now() + stock.id,
          stock: stock.id,
          stock_codigo: stock.codigo,
          stock_descripcion: stock.descripcion,
          stock_pza: stock.pza,
          stock_factor_conversion: factor,
          stock_proveedor: config.stock_proveedor,
          cual_costo: config.cual_costo,
          cantidad: cantidadReal,
          precio_unitario_dolares: config.precio_unitario_dolares,
          tipo_venta: config.tipo_venta || 'cantidad',
          proveedor_nombre:
            stock.proveedores?.find((p) => p.id === config.stock_proveedor)
              ?.proveedor_nombre || "",
          proveedores: stock.proveedores,
        });
      }
    });

    return selectedItems;
  };

  // Confirmar selección - solo los que tienen cantidad > 0
  const handleConfirm = () => {
    const selectedItems = getSelectedItems();

    // Validar que la cantidad no exceda el stock disponible
    const errors = [];
    selectedItems.forEach((item) => {
      const stockItem = stockData.find((s) => s.id === item.stock);
      if (stockItem && item.cantidad > stockItem.cantidad) {
        errors.push(
          `${stockItem.codigo}: Stock disponible (${stockItem.cantidad}) < cantidad solicitada (${item.cantidad})`,
        );
      }
    });

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Agrega cantidad a al menos un item");
      return;
    }

    onConfirm(selectedItems);
    onClose();
  };

  // Validar cantidad al cambiar - no permitir más que el stock (o equivalente)
  const handleCantidadChange = (stockId, value) => {
    const stock = stockData.find((s) => s.id === stockId);
    const config = itemsConfig[stockId] || {};
    let nuevaCantidad = parseFloat(value) || 0;

    // Si es mts_ml_m2, validar contra el equivalente máximo
    if (config.tipo_venta === 'mts_ml_m2' && stock.factor_conversion && stock.factor_conversion > 0) {
      const maxEquivalente = stock.cantidad * stock.factor_conversion;
      if (nuevaCantidad > maxEquivalente) {
        nuevaCantidad = maxEquivalente;
        toast.warn(`El equivalente no puede exceder ${maxEquivalente.toFixed(0)} (stock disponible)`);
      }
    } else {
      // Validar contra el stock normal
      if (stock && nuevaCantidad > stock.cantidad) {
        nuevaCantidad = stock.cantidad;
        toast.warn(`La cantidad no puede exceder el stock (${stock.cantidad})`);
      }
    }

    handleUpdateItem(stockId, "cantidad", nuevaCantidad);
  };

  // Filtrar stock por búsqueda
  const filteredStock = useMemo(() => {
    if (!search) return stockData;
    const searchLower = search.toLowerCase();
    return stockData.filter(
      (s) =>
        s.codigo?.toLowerCase().includes(searchLower) ||
        s.descripcion?.toLowerCase().includes(searchLower),
    );
  }, [stockData, search]);

  // Opciones de costo dinámicas basadas en los porcentajes de utilidad
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

  // Opciones de tipo de venta
  const tipoVentaOptions = [
    { value: 'cantidad', label: 'Cantidad' },
    { value: 'mts_ml_m2', label: 'MTS/ML/M²' },
  ];

  // Calcular total de items seleccionados
  const total = getSelectedItems().reduce((sum, item) => {
    return (
      sum +
      (parseFloat(item.precio_unitario_dolares) || 0) *
        (parseInt(item.cantidad) || 0)
    );
  }, 0);

  // Contar cuántos items tienen cantidad > 0
  const selectedCount = getSelectedItems().length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Ferretería"
      width="max-w-6xl"
    >
      <div className="space-y-4">
        {/* Buscador */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en inventario..."
              className="w-full pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#43A29E]"
            />
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedCount}</span> item(s)
            seleccionado(s)
          </div>
        </div>

        {/* Contenedor de la tabla con overflow controlado */}
        <div className="border rounded-lg overflow-visible my-4 pb-10 relative">
          <div className="overflow-x-auto min-h-[200px] pb-16">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-[#43A29E] text-white">
                <tr>
                  <th className="px-3 py-2 text-left min-w-[80px]">Código</th>
                  <th className="px-3 py-2 text-left min-w-[200px]">
                    Descripción
                  </th>
                  <th className="px-3 py-2 text-right min-w-[60px]">Stock</th>
                  <th className="px-3 py-2 text-left min-w-[100px]">
                    Proveedor
                  </th>
                  <th className="px-3 py-2 text-center min-w-[60px]">Costo</th>
                  <th className="px-3 py-2 text-center min-w-[80px]">Tipo Venta</th>
                  <th className="px-3 py-2 text-center min-w-[60px]">
                    Cantidad
                  </th>
                  <th className="px-3 py-2 text-center min-w-[80px]">Equivalente</th>
                  <th className="px-3 py-2 text-right min-w-[80px]">Total</th>
                </tr>
              </thead>
              <tbody
              >
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : filteredStock.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No hay items disponibles
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((stock) => {
                    const config = itemsConfig[stock.id] || {};
                    const isSelected = config.cantidad > 0;
                    const sinStock = stock.cantidad === 0;
                    const factor = stock.factor_conversion || 1;
                    const cantidad = config.cantidad || 0;
                    const equivalente = cantidad * factor;

                    return (
                      <tr
                        key={stock.id}
                        className={`border-b transition ${isSelected ? "bg-green-50" : "hover:bg-gray-50"} ${sinStock ? "bg-gray-50" : ""}`}
                      >
                        <td className="px-3 py-2 font-medium">
                          {stock.codigo}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="block max-w-[200px] truncate"
                            title={stock.descripcion}
                          >
                            {stock.descripcion}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`text-xs px-2 py-1 rounded ${stock.cantidad > 0 ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}
                            title={config.tipo_venta === 'mts_ml_m2' ? `${stock.cantidad} unidades` : ''}
                          >
                            {config.tipo_venta === 'mts_ml_m2' && stock.factor_conversion
                              ? `${(stock.cantidad * stock.factor_conversion).toFixed(0)} ${stock.pza || 'MTS'}`
                              : `${stock.cantidad}`}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="max-w-[150px]">
                            <Select
                              options={(stock.proveedores || []).map((p) => ({
                                value: p.id,
                                label:
                                  p.proveedor_nombre ||
                                  p.proveedor?.name ||
                                  `Proveedor ${p.proveedor}`,
                              }))}
                              value={
                                config.stock_proveedor
                                  ? {
                                      value: config.stock_proveedor,
                                      label:
                                        stock.proveedores?.find(
                                          (p) =>
                                            p.id === config.stock_proveedor,
                                        )?.proveedor_nombre || "",
                                    }
                                  : null
                              }
                              onChange={(opt) =>
                                handleUpdateItem(
                                  stock.id,
                                  "stock_proveedor",
                                  opt?.value,
                                )
                              }
                              className="proveedor-select text-xs"
                              classNamePrefix="react-select"
                              placeholder="Seleccionar"
                              isClearable
                              isDisabled={
                                sinStock || !stock.proveedores?.length
                              }
                              menuPortalTarget={document.body}
                              menuShouldScrollIntoView={false}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minWidth: "120px",
                                }),
                                singleValue: (base) => ({
                                  ...base,
                                  textOverflow: "ellipsis",
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                }),
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            options={costoOptions}
                            value={costoOptions.find(
                              (o) => o.value === config.cual_costo,
                            )}
                            onChange={(opt) => {
                              if (opt) {
                                handleUpdateItem(
                                  stock.id,
                                  "cual_costo",
                                  opt.value,
                                );
                                const prov = stock.proveedores?.find(
                                  (p) => p.id === config.stock_proveedor,
                                );
                                if (prov) {
                                  handleUpdateItem(
                                    stock.id,
                                    "precio_unitario_dolares",
                                    prov[opt.value] || 0,
                                  );
                                }
                              }
                            }}
                            className="costo-select text-xs w-16"
                            classNamePrefix="react-select"
                            isDisabled={sinStock || !stock.proveedores?.length}
                            menuPortalTarget={document.body}
                            menuShouldScrollIntoView={false}
                            styles={{
                              menu: (base) => ({ ...base, zIndex: 99999 }),
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            options={tipoVentaOptions}
                            value={tipoVentaOptions.find(
                              (o) => o.value === config.tipo_venta,
                            )}
                            onChange={(opt) => {
                              if (opt) {
                                handleUpdateItem(
                                  stock.id,
                                  "tipo_venta",
                                  opt.value,
                                );
                              }
                            }}
                            className="tipo-venta-select text-xs w-24"
                            classNamePrefix="react-select"
                            isDisabled={sinStock || !stock.proveedores?.length || !stock.factor_conversion}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={config.cantidad || ""}
                            onChange={(e) =>
                              handleCantidadChange(stock.id, e.target.value)
                            }
                            min="0"
                            max={
                              config.tipo_venta === 'mts_ml_m2' && factor > 1
                                ? stock.cantidad * factor
                                : stock.cantidad
                            }
                            disabled={sinStock}
                            className={`w-16 border rounded px-2 py-1 text-sm text-center ${isSelected ? "border-green-500 bg-white" : "border-gray-300"} ${sinStock ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            placeholder={sinStock ? "Sin stock" : "0"}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {config.tipo_venta === 'mts_ml_m2' && factor > 1 ? (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded" title="Unidades reales">
                              {Math.floor(config.cantidad / factor)} UND
                            </span>
                          ) : factor > 1 ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {(config.cantidad * factor).toFixed(factor % 1 === 0 ? 0 : 2)} {stock.pza || 'MTS'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          $
                          {(
                            (parseFloat(config.precio_unitario_dolares) || 0) *
                            (parseInt(config.cantidad) || 0)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end pt-8 border-t ">
          <span className="text-xl font-bold text-gray-800">
            Total: ${total.toFixed(2)}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-[#43A29E] rounded-lg hover:bg-[#2B3744] disabled:opacity-50"
          >
            Agregar ({selectedCount})
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ItemSelectionModal;
