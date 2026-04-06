import { useEffect, useState } from "react";
import { getProveedoresSearch } from "../api/controllers/Inventario";

export default function useProveedores(search = "") {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** ======================
   * Cargar proveedores
   * ====================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getProveedoresSearch(search);
      setProveedores(result.results);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /** ======================
   * Ejecutar al montar o cuando cambia `search`
   * ====================== */
  useEffect(() => {
    fetchData();
  }, [search]);

  return { proveedores, loading, error, refetch: fetchData };
}
