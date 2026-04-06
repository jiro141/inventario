import React, { useState, useEffect } from "react";
import Select from "react-select";

const StepForm = ({ steps, onSubmit, initialValues = {} }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialValues);
  const [searchTerms, setSearchTerms] = useState({});

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCustomChange = (name, newValue) => {
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSearchChange = (name, inputValue) => {
    setSearchTerms((prev) => ({ ...prev, [name]: inputValue }));
  };

  const handleNext = () => {
    if (!isLastStep) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const sortedFields = [
    ...step.fields.filter((f) => f.name === "descripcion"),
    ...step.fields.filter((f) => f.name !== "descripcion"),
  ];

  // step.columns puede ser:
  // - Un número (fijo): 1, 2, 3
  // - Un objeto responsive: { base: 1, md: 2, lg: 3 }
  const colConfig = step.columns;
  const isResponsive = colConfig && typeof colConfig === 'object';

  const gridClass = isResponsive
    ? [
        colConfig.base   ? `grid-cols-${colConfig.base}`   : '',
        colConfig.sm     ? `sm:grid-cols-${colConfig.sm}`   : '',
        colConfig.md     ? `md:grid-cols-${colConfig.md}`   : '',
        colConfig.lg     ? `lg:grid-cols-${colConfig.lg}`   : '',
        colConfig.xl     ? `xl:grid-cols-${colConfig.xl}`   : '',
      ].filter(Boolean).join(' ')
    : `grid-cols-${colConfig ?? (step.fields.length > 3 ? 2 : 1)}`;

  return (
    <form onSubmit={handleFinalSubmit} className="space-y-6">
      <div className={`grid gap-4 ${gridClass}`}>
        {sortedFields.map((field) => {
          const value = formData[field.name] ?? "";
          const colSpanClass = field.name === "descripcion" ? `col-span-1` : "col-span-1";

          // 🔍 Hook dinámico para cargar datos según búsqueda
          const hookData =
            field.fetchHook && typeof field.fetchHook === "function"
              ? field.fetchHook(searchTerms[field.name] || "")
              : { [field.hookKey || "options"]: field.options || [] };

          const options =
            hookData[field.hookKey || "options"]?.map((item) => ({
              label: item.label || item.nombre || item.descripcion || item.name,
              value: item.value || item.id,
            })) || [];

          return (
            <div key={field.name} className={colSpanClass}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>

              {field.type === "switch" ? (
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <span
                    className={`text-sm font-medium select-none ${
                      value ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {value ? "Aprobado" : "En espera"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!value}
                      onChange={(e) =>
                        handleCustomChange(field.name, e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-gray-300 rounded-full peer-focus:ring-4 peer-focus:ring-blue-200 peer-checked:bg-green-500 transition-all duration-300"></div>
                    <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 peer-checked:translate-x-5"></div>
                  </label>
                </div>
              ) : field.type === "select" ? (
                <Select
                  name={field.name}
                  options={options}
                  value={options.find((opt) => opt.value === value) || null}
                  onChange={(opt) =>
                    handleCustomChange(field.name, opt ? opt.value : "")
                  }
                  onInputChange={(inputValue) =>
                    field.fetchOnSearch && handleSearchChange(field.name, inputValue)
                  }
                  placeholder="Buscar..."
                  isClearable
                  isSearchable
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={value}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={value}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required={field.required}
                  disabled={field.disabled}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 gap-4">
        {step.actions?.map((action, index) => (
          <button
            key={index}
            type="button"
            onClick={action.onClick}
            className="bg-[#43A29E] hover:bg-[#2B3744] text-white font-semibold px-6 py-2 rounded transition duration-200"
          >
            {action.label}
          </button>
        ))}

        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Atrás
          </button>
        )}

        <div className="ml-auto">
          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              className="bg-[#43A29E] hover:bg-[#2B3744] text-white font-semibold px-6 py-2 rounded transition duration-200"
            >
              Enviar
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default StepForm;
