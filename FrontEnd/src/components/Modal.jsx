import React from "react";

const Modal = ({ isOpen, onClose, title, children, width, height }) => {
  if (!isOpen) return null;

  // 🧠 Si se pasa width, úsalo; si no, usa el valor por defecto
  const modalWidth = width ? width : "max-w-lg";
  const modalHeight = height ? height : "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center">
      <div
        className={`bg-white w-full ${modalWidth} rounded-lg shadow-lg relative ${modalHeight} z-[9999]`}
      >
        {/* Encabezado */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#43A29E] rounded-t-lg">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-3xl font-bold leading-none transition transform hover:scale-110"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[90vh]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
