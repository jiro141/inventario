import React from "react";
import Modal from "./Modal";
import { FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar", 
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger" // 'danger' | 'warning' | 'info'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const typeStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-500 hover:bg-yellow-600",
    info: "bg-[#43A29E] hover:bg-[#2B3744]",
  };

  const typeIcons = {
    danger: <FaExclamationTriangle />,
    warning: <FaExclamationTriangle />,
    info: <FaCheck />,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="max-w-sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            type === 'danger' ? 'bg-red-100 text-red-600' :
            type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
            'bg-[#43A29E]/10 text-[#43A29E]'
          }`}>
            {typeIcons[type]}
          </div>
          <p className="text-gray-700 pt-2">{message}</p>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <FaTimes size={12} />
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${typeStyles[type]}`}
          >
            <FaCheck size={12} />
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;