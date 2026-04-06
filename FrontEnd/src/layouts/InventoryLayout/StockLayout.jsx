import React, { useState } from "react";
import Tables from "../../components/Tables";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import useInventario from "../../hooks/useInventario";
import useDepartamentos from "../../hooks/useDepartamentos";
import StockModal from "./StockModal";
import { createItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";

// Las columnas se arman dinámicamente en Tables.jsx según la taza

export default function StockLayout() {
  const [search, setSearch] = useState("");
  const { data, loading, error, refetch } = useInventario("stock", search);
console.log(data);

  const {
    data: taza,
    loading: tazaLoading,
    error: tazaError,
    refetch: tazaRefetch,
  } = useInventario("taza");

  const { departamentos, refetch: refetchDepartamentos } = useDepartamentos();
  const [editItem, setEditItem] = useState(null);
  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [isDeptModalOpen, setDeptModalOpen] = useState(false);

  // Callback para actualizar departamentos después de crear uno nuevo
  const handleDeptCreated = () => {
    refetchDepartamentos();
  };

  const handleNewDept = async (formData) => {
    await createItem("departamentos", formData);
    refetchDepartamentos();
    setDeptModalOpen(false);
    toast.success("Departamento creado exitosamente");
  };

  const handleAddOrEdit = (item = null) => {
    setEditItem(item);
    setStockModalOpen(true);
  };

  const handleStockSaved = () => {
    setStockModalOpen(false);
    setEditItem(null);
    refetch();
  };

  const deptForm = [
    {
      fields: [{ name: "name", label: "Nombre", required: true }],
    },
  ];

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
      <Tables
        title="Ferretería industrial"
        data={data || []}
        refetch={refetch}
        tipo={"stock"}
        loading={loading}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
        tasa={taza}
        tasaLoading={tazaLoading}
        tasaError={tazaError}
        tasaRefetch={tazaRefetch}
      />

      {/* Modal de stock con dos etapas */}
      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setStockModalOpen(false);
          setEditItem(null);
        }}
        stockItem={editItem}
        departamentos={departamentos}
        onSaved={handleStockSaved}
        onDeptCreated={handleDeptCreated}
      />

      {/* Modal para nuevo departamento */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Nuevo Departamento"
      >
        <StepForm
          steps={deptForm}
          onSubmit={handleNewDept}
          initialValues={{}}
        />
      </Modal>
    </div>
  );
}
