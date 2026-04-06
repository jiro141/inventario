import { useEffect, useState } from "react";
import { getMovimientos } from "../api/controllers/Inventario";

const useMovimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMovimientos = async () => {
    try {
      const res = await getMovimientos();
      
      setMovimientos(res.data.results);
    } catch (err) {
      console.error("Error cargando movimientos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  return { movimientos, loading, refetch: fetchMovimientos };
};

export default useMovimientos;
