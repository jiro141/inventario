import { FaDollarSign } from "react-icons/fa";

export default function DollarCard({
  nombre,
  promedio,
  fechaActualizacion,
  prevPromedio,
}) {
  const getVariation = (current, prev) => {
    if (!prev || prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

  const variation = getVariation(promedio, prevPromedio);

  return (
    <div className="relative bg-white shadow-md rounded-lg p-4 pt-8 overflow-visible">
      {/* Icono flotante */}
      <div
        className="absolute -top-4 left-5 w-12 h-12 flex items-center justify-center rounded-lg z-[5]"
        style={{ backgroundColor: "#43A29E", color: "white" }}
      >
        <FaDollarSign size={20} />
      </div>

      {/* Contenido */}
      <div>
        <p className="text-sm text-gray-500 pt-2">
          Dolar {nombre === "Paralelo" ? "Mercado negro" : nombre}
        </p>
        <p className="text-2xl font-bold text-gray-800">
          Bs. {promedio.toFixed(2)}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(fechaActualizacion).toLocaleString("es-VE")}
        </p>

        {/* Variación */}
        <span
          className={`mt-2 block text-sm font-semibold ${
            variation > 0
              ? "text-green-600"
              : variation < 0
              ? "text-red-600"
              : "text-gray-500"
          }`}
        ></span>
      </div>
    </div>
  );
}
