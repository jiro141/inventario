import React, { useState } from "react";
import Modal from "../components/Modal";
import StepForm from "../components/StepForm";
import Tables from "../components/Tables";
import { createItem, updateItem } from "../api/controllers/Inventario";
import { toast } from "react-toastify";
import useProveedores from "../hooks/useProveedores";

const columns = [
  { key: "name", label: "Nombre de la Empresa" },
  { key: "direccion", label: "Dirección" },
  { key: "telefono", label: "Teléfono" },
  { key: "encargado", label: "Encargado" },
];

export default function ProveedoresHome() {
  const [search, setSearch] = useState("");
  const { proveedores, loading, error, refetch } = useProveedores(search);
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateItem("proveedores", editItem.id, formData);
        toast.success("Proveedor actualizado con éxito");
      } else {
        const newProveedor = await createItem("proveedores", formData);
        setEditItem(newProveedor);
        toast.success("Proveedor creado con éxito");
      }
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar proveedor");
    }
  };

  const handleAddOrEdit = (item = null) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const formSteps = [
    {
      fields: [
        { name: "name", label: "Nombre de la Empresa", required: true },
        { name: "direccion", label: "Dirección", required: true },
        { name: "telefono", label: "Teléfono", required: true },
        { name: "encargado", label: "Encargado", required: true },
      ],
    },
  ];

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
      <Tables
        columns={columns}
        data={proveedores || []}
        title="Proveedores"
        refetch={refetch}
        tipo="proveedores"
        loading={loading}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        title={editItem ? "Editar Proveedor" : "Agregar Proveedor"}
        // width="max-w-5xl"
      >
        <div className="grid grid-cols-1  gap-6">
          <div className="flex justify-center items-center">
            <StepForm
              steps={formSteps}
              onSubmit={handleSubmit}
              initialValues={editItem || {}}
            />
          </div>

          {/* 🧩 Componente externo manejando artículos */}
        </div>
      </Modal>
    </div>
  );
}
