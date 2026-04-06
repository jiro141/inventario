import { useMemo } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { FaTools } from "react-icons/fa";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";

export default function TimelineCard({ movimientos }) {
  // Calcular resumen por item
  const resumen = useMemo(() => {
    const map = {};
    
    movimientos.forEach((mov) => {
      if (!mov.stock) return;
      
      if (!map[mov.stock]) {
        map[mov.stock] = {
          id: mov.stock,
          nombre: mov.nombre,
          entradas: 0,
          salidas: 0,
        };
      }
      
      if (mov.tipo === "entrada") {
        map[mov.stock].entradas += mov.cantidad;
      } else if (mov.tipo === "salida") {
        map[mov.stock].salidas += mov.cantidad;
      }
    });

    return Object.values(map).sort((a, b) => (b.entradas + b.salidas) - (a.entradas + a.salidas));
  }, [movimientos]);

  const getIcon = (mov) => {
    if (mov.stock) return <FaTools className="text-[#43A29E]" size={18} />;
    return null;
  };

  const getArrow = (tipo) => {
    return tipo === "entrada" ? (
      <FaArrowUp className="text-green-500" />
    ) : (
      <FaArrowDown className="text-red-500" />
    );
  };

  // Calcular totales generales
  const totales = useMemo(() => {
    return resumen.reduce((acc, item) => ({
      entradas: acc.entradas + item.entradas,
      salidas: acc.salidas + item.salidas,
    }), { entradas: 0, salidas: 0 });
  }, [resumen]);

  return (
    <div className="absolute bg-white shadow-md rounded-lg p-5 flex flex-col max-h-[calc(95vh-6rem)]">
      {/* Header con icono y título */}
      <div className="flex items-center mb-4">
        <div
          className="absolute -top-4 left-5 w-12 h-12 flex items-center justify-center rounded-lg shadow-md"
          style={{ backgroundColor: "#43A29E", color: "white" }}
        >
          <HiMiniArrowsUpDown size={18} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mt-5">Movimientos</h2>
      </div>

      {/* Resumen de totales por item */}
      {resumen.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">Resumen por Item:</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scroll">
            {resumen.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-800 font-medium truncate flex-1 mr-2" title={item.nombre}>
                  {item.nombre}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-green-600 font-medium">
                    +{item.entradas}
                  </span>
                  <span className="text-red-600 font-medium">
                    -{item.salidas}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Totales generales */}
          <div className="mt-3 flex items-center justify-between text-sm font-bold bg-[#43A29E] text-white rounded px-3 py-2">
            <span>Total:</span>
            <div className="flex items-center gap-4">
              <span className="text-green-200">Entradas: {totales.entradas}</span>
              <span className="text-red-200">Salidas: {totales.salidas}</span>
            </div>
          </div>
        </div>
      )}

      {/* Detalle de movimientos */}
      <div className="flex-1 overflow-y-auto custom-scroll pr-2 min-h-[calc(40vh)]">
        {movimientos.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay movimientos registrados.</p>
        ) : (
          movimientos.map((mov) => (
            <div key={mov.id} className="flex items-start gap-3 mb-4">
              {/* Icono del tipo de item */}
              <div className="mt-1">{getIcon(mov)}</div>

              {/* Contenido */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                  <span>
                    {mov.nombre} — {mov.cantidad} unidades
                  </span>
                  <span>{getArrow(mov.tipo)}</span>
                </p>
                <p className="text-xs text-gray-500">{mov.observacion}</p>
                <p className="text-xs text-gray-400">
                  {new Date(mov.fecha).toLocaleString("es-VE")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}