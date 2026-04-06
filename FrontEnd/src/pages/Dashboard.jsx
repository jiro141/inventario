import { useEffect, useState } from "react";
import {
  getMovimientos,
  getStock,
  getProveedores,
  getProveedoresSearch,
} from "../api/controllers/Inventario";

import GallerySlider from "./components/GallerySlider";
import DollarCard from "./components/DollarCard";
import Timeline from "./components/Timeline";
import ProveedoresTable from "./components/ProveedoresTable";

import img1 from "../assets/img/IMAGENES/1.jpg";
import img2 from "../assets/img/IMAGENES/2.jpg";
import img3 from "../assets/img/IMAGENES/3.jpg";
import img4 from "../assets/img/IMAGENES/4.jpg";
import img5 from "../assets/img/IMAGENES/5.jpg";
import img6 from "../assets/img/IMAGENES/6.jpg";
import img7 from "../assets/img/IMAGENES/7.jpg";
import img8 from "../assets/img/IMAGENES/8.jpg";

const Dashboard = () => {
  const [dolares, setDolares] = useState([]);
  const [prevDolares, setPrevDolares] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [proveedores, setProveedores] = useState([]); // 🚀 nuevo estado

  /** ==============================
   * 1) Cargar valores del dólar
   * ============================== */
  useEffect(() => {
    const fetchDolares = async () => {
      try {
        const res = await fetch("https://ve.dolarapi.com/v1/dolares");
        const json = await res.json();

        const filtered = json.filter(
          (item) => item.fuente === "oficial" || item.fuente === "paralelo"
        );

        if (dolares.length > 0) setPrevDolares(dolares);
        setDolares(filtered);
      } catch (error) {
        console.error("Error al cargar dólares:", error);
      }
    };

    fetchDolares();
    const interval = setInterval(fetchDolares, 60000);
    return () => clearInterval(interval);
  }, []);

  /** ==============================
   * 2) Cargar movimientos + nombres reales
   * ============================== */
  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const [movs, stocks] = await Promise.all([
          getMovimientos(),
          getStock(),
        ]);
        const stockMap = Object.fromEntries(stocks.results.map((s) => [s?.id, s.descripcion]));

        const enriched = movs.results.map((mov) => {
          let nombre = "Desconocido";
          if (mov.stock) nombre = stockMap[mov.stock] || "Stock sin nombre";

          return { ...mov, nombre };
        });

        setMovimientos(enriched);
      } catch (error) {
        console.error("Error cargando movimientos:", error);
      }
    };

    fetchMovimientos();
  }, []);

  /** ==============================
   * 3) Cargar proveedores
   * ============================== */
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const data = await getProveedores();
        setProveedores(data.results);
      } catch (error) {
        console.error("Error cargando proveedores:", error);
      }
    };

    fetchProveedores();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden gap-6 ">
      {/* Columna izquierda: galería */}
      <div className="flex-shrink-0">
        <GallerySlider
          images={[img1, img2, img3, img4, img5, img6, img7, img8]}
          interval={4000}
        />
      </div>

      {/* Columna derecha: cards + timeline + proveedores */}
      <div className="flex-1 overflow-y-auto overflow-x-visible custom-scroll ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 absolute">
          {/* Dollar Cards */}
          <div className="col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
              {dolares.map((item) => {
                const prev = prevDolares.find((p) => p.fuente === item.fuente);
                return (
                  <DollarCard
                    key={item.fuente}
                    nombre={item.nombre}
                    promedio={item.promedio}
                    fechaActualizacion={item.fechaActualizacion}
                    prevPromedio={prev ? prev.promedio : null}
                  />
                );
              })}
            </div>

            {/* Tabla de proveedores debajo de las cards */}
            <div className="mt-6">
              <ProveedoresTable
                proveedores={proveedores}
                onSearch={async (term) => {
                  const data = await getProveedoresSearch(term);
                  setProveedores(data);
                }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="col-span-1">
            <Timeline movimientos={movimientos} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
