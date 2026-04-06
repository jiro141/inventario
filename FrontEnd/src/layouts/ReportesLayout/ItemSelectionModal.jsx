import React, { useState, useEffect, useMemo } from "react";
import Modal from "../../components/Modal";
import Select from "react-select";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import { getStock } from "../../api/controllers/Inventario";

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

  // Items con su configuración (cada item tiene su propio estado)
  const [itemsConfig, setItemsConfig] = useState({});

  // Cargar stock al abrir
  useEffect(() => {
    if (isOpen) {
      cargarStock();
    }
  }, [isOpen]);

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
          };
        } else if (stock.proveedores && stock.proveedores.length > 0) {
          // Valores por defecto
          initialConfig[stock.id] = {
            stock_proveedor: stock.proveedores[0]?.id || null,
            cual_costo: "costo_1",
            cantidad: 0,
            precio_unitario_dolares: stock.proveedores[0]?.costo_1 || 0,
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

      return { ...prev, [stockId]: itemConfig };
    });
  };

  // Obtener los items que tienen cantidad > 0
  const getSelectedItems = () => {
    const selectedItems = [];

    stockData.forEach((stock) => {
      const config = itemsConfig[stock.id];
      if (config && config.cantidad > 0 && config.stock_proveedor) {
        selectedItems.push({
          tempId: Date.now() + stock.id,
          stock: stock.id,
          stock_codigo: stock.codigo,
          stock_descripcion: stock.descripcion,
          stock_proveedor: config.stock_proveedor,
          cual_costo: config.cual_costo,
          cantidad: config.cantidad,
          precio_unitario_dolares: config.precio_unitario_dolares,
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

  // Validar cantidad al cambiar - no permitir más que el stock
  const handleCantidadChange = (stockId, value) => {
    const stock = stockData.find((s) => s.id === stockId);
    let nuevaCantidad = parseInt(value) || 0;

    // Si excede el stock, limitar y mostrar warning
    if (stock && nuevaCantidad > stock.cantidad) {
      nuevaCantidad = stock.cantidad;
      toast.warn(`La cantidad no puede exceder el stock (${stock.cantidad})`);
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

  // Opciones de costo (mostrar porcentajes completos)
  const costoOptions = [
    { value: "costo_1", label: "10%" },
    { value: "costo_2", label: "15%" },
    { value: "costo_3", label: "25%" },
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
        <div className="border rounded-lg overflow-hidden my-4 pb-10 z-[99]">
          <div className="overflow-x-auto min-h-[200px] pb-16">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-[#43A29E] text-white">
                <tr>
                  <th className="px-3 py-2 text-left min-w-[80px]">Código</th>
                  <th className="px-3 py-2 text-left min-w-[200px]">
                    Descripción
                  </th>
                  <th className="px-3 py-2 text-right min-w-[60px]">Stock</th>
                  <th className="px-3 py-2 text-left min-w-[150px]">
                    Proveedor
                  </th>
                  <th className="px-3 py-2 text-center min-w-[80px]">Costo</th>
                  <th className="px-3 py-2 text-center min-w-[80px]">
                    Cantidad
                  </th>
                  <th className="px-3 py-2 text-right min-w-[80px]">Total</th>
                </tr>
              </thead>
              <tbody
              >
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : filteredStock.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
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
                          >
                            {stock.cantidad}
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
                              className="react-select-container text-xs"
                              classNamePrefix="react-select"
                              placeholder="Seleccionar"
                              isClearable
                              isDisabled={
                                sinStock || !stock.proveedores?.length
                              }
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minWidth: "120px",
                                  zIndex: 99999999999,
                                }),
                                singleValue: (base) => ({
                                  ...base,
                                  textOverflow: "ellipsis",
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                }),
                                menu: (base) => ({
                                  ...base,
                                  zIndex: 99999,
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
                            className="react-select-container text-xs w-20"
                            classNamePrefix="react-select"
                            isDisabled={sinStock || !stock.proveedores?.length}
                            styles={{
                              control: (base) => ({
                                ...base,
                                zIndex: 50,
                              }),
                              menu: (base) => ({
                                ...base,
                                zIndex: 99999,
                              }),
                            }}
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
                            max={stock.cantidad}
                            disabled={sinStock}
                            className={`w-16 border rounded px-2 py-1 text-sm text-center ${isSelected ? "border-green-500 bg-white" : "border-gray-300"} ${sinStock ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            placeholder={sinStock ? "Sin stock" : "0"}
                          />
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
