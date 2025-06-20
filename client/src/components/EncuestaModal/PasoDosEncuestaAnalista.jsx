import { useState } from "react";

const AREAS = [
  "Tecnología y Desarrollo",
  "Administración y Finanzas",
  "Marketing y Comunicación",
  "Comercio y Ventas",
  "Industria y Producción",
  "Servicios Generales y Gastronomía"
];

export default function PasoDosEncuestaAnalista({ formData, setFormData, onNext, onBack, onCancel }) {
  const [tipoEnvio, setTipoEnvio] = useState(formData.tipoEnvio || "");
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState(formData.emails || []);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState(formData.areas || []);
  const [jefesAreasSeleccionadas, setJefesAreasSeleccionadas] = useState(formData.jefesSeleccionados || []);

  const handleTipoChange = (e) => {
    const value = e.target.value;
    setTipoEnvio(value);
    setFormData({ ...formData, tipoEnvio: value });
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const nuevoEmail = emailInput.trim();
      if (nuevoEmail && !emails.includes(nuevoEmail)) {
        const nuevos = [...emails, nuevoEmail];
        setEmails(nuevos);
        setFormData({ ...formData, emails: nuevos });
      }
      setEmailInput("");
    }
  };

  const eliminarEmail = (email) => {
    const nuevos = emails.filter((e) => e !== email);
    setEmails(nuevos);
    setFormData({ ...formData, emails: nuevos });
  };

  const toggleArea = (area, tipo) => {
    const selected = tipo === "area" ? areasSeleccionadas : jefesAreasSeleccionadas;
    const nuevos = selected.includes(area)
      ? selected.filter((a) => a !== area)
      : [...selected, area];

    if (tipo === "area") {
      setAreasSeleccionadas(nuevos);
      setFormData({ ...formData, areas: nuevos });
    } else {
      setJefesAreasSeleccionadas(nuevos);
      setFormData({ ...formData, jefesSeleccionados: nuevos });
    }
  };

  const toggleSeleccionarTodosJefes = () => {
    const todos = jefesAreasSeleccionadas.length === AREAS.length ? [] : [...AREAS];
    setJefesAreasSeleccionadas(todos);
    setFormData({ ...formData, jefesSeleccionados: todos });
  };

  return (
    <div className="text-black px-6 py-4 space-y-6">
      <h2 className="text-xl font-semibold">¿A quién está dirigida la encuesta?</h2>

      <div className="space-y-3">
        {/* Jefes específicos (primero) */}
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="destinatario"
            value="jefes_especificos"
            checked={tipoEnvio === "jefes_especificos"}
            onChange={handleTipoChange}
            className="accent-blue-600 w-5 h-5"
          />
          <span>Seleccionar jefes de área específicos</span>
        </label>

        {tipoEnvio === "jefes_especificos" && (
          <div className="ml-8 space-y-2">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                className="accent-blue-500 w-4 h-4"
                checked={jefesAreasSeleccionadas.length === AREAS.length}
                onChange={toggleSeleccionarTodosJefes}
              />
              <span>Seleccionar todos</span>
            </label>
            {AREAS.map((area) => (
              <label key={area} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-blue-500 w-4 h-4"
                  checked={jefesAreasSeleccionadas.includes(area)}
                  onChange={() => toggleArea(area, "jefes")}
                />
                <span>Jefe de {area}</span>
              </label>
            ))}
          </div>
        )}

        {/* Todos los empleados */}
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="destinatario"
            value="empleados"
            checked={tipoEnvio === "empleados"}
            onChange={handleTipoChange}
            className="accent-blue-600 w-5 h-5"
          />
          <span>Todos los empleados (excepto jefes de área)</span>
        </label>

        {/* Emails específicos */}
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="destinatario"
            value="emails"
            checked={tipoEnvio === "emails"}
            onChange={handleTipoChange}
            className="accent-blue-600 w-5 h-5"
          />
          <span>Empleado particular (por email)</span>
        </label>

        {tipoEnvio === "emails" && (
          <div className="ml-8 space-y-2">
            <input
              type="text"
              placeholder="Presioná Enter para agregar"
              className="w-full p-2 border border-gray-300 rounded"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
            />
            <div className="flex flex-wrap gap-2">
              {emails.map((email, index) => (
                <div
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-2"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => eliminarEmail(email)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toda un área */}
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="destinatario"
            value="area"
            checked={tipoEnvio === "area"}
            onChange={handleTipoChange}
            className="accent-blue-600 w-5 h-5"
          />
          <span>Toda un área</span>
        </label>

        {tipoEnvio === "area" && (
          <div className="ml-8 space-y-2">
            {AREAS.map((area) => (
              <label key={area} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-blue-500 w-4 h-4"
                  checked={areasSeleccionadas.includes(area)}
                  onChange={() => toggleArea(area, "area")}
                />
                <span>{area}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={onCancel} className="px-4 py-2 bg-red-400 hover:bg-red-500 text-white rounded">Cancelar</button>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">Atrás</button>
          <button onClick={onNext} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Siguiente</button>
        </div>
      </div>
    </div>
  );
}
