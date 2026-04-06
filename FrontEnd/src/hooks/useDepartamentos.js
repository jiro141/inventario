import { useEffect, useState } from "react";
import AuthApi from "../api/AuthApi";

const useDepartamentos = (searchTerm = "") => {
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartamentos = async (query = "") => {
    try {
      setLoading(true);
      const res = await AuthApi.get(`/inventario/departamentos/?search=${query}`);
      setDepartamentos(res.data.results);
    } catch (err) {
      console.error("Error cargando departamentos:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos(searchTerm);
  }, [searchTerm]);

  return {
    departamentos,
    loading,
    error,
    refetch: fetchDepartamentos,
  };
};

export default useDepartamentos;
