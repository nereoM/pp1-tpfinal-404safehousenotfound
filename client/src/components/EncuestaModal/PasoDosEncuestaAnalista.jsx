import { useState, useEffect } from "react";

export default function PasoDosEncuestaAnalista({ formData, setFormData, onNext, onBack, onCancel }) {
  const [tipoEnvio, setTipoEnvio] = useState(formData.tipoEnvio || "");
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState(formData.emails || []);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState(formData.areas || []);
  const [jefesAreasSeleccionadas, setJefesAreasSeleccionadas] = useState(formData.jefesSeleccionados || []);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState(formData.empleadosSeleccionados || []);
  const [areas, setAreas] = useState([]);
  const [jefesArea, setJefesArea] = useState([]);
  const [empleadosNormales, setEmpleadosNormales] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [error, setError] = useState("");

  // Sincronizar los datos completos de los jefes seleccionados para el paso 4
  useEffect(() => {
    if (tipoEnvio === "jefes_especificos") {
      const seleccionados = jefesArea.filter(j => jefesAreasSeleccionadas.includes(j.puesto_trabajo));
      setFormData({
        ...formData,
        jefesSeleccionados: jefesAreasSeleccionadas,
        jefesSeleccionadosDatos: seleccionados
      });
    }
    // Si se cambia a otro tipo de destinatario, limpiar jefesSeleccionadosDatos
    else if (formData.jefesSeleccionadosDatos && formData.jefesSeleccionadosDatos.length > 0) {
      setFormData({
        ...formData,
        jefesSeleccionadosDatos: []
      });
    }
    // eslint-disable-next-line
  }, [jefesAreasSeleccionadas, tipoEnvio, jefesArea]);

  useEffect(() => {
    // Fetch dinámico de áreas, jefes y empleados desde el backend
    const fetchInfo = async () => {
      try {
        const res = await fetch("/api/info-para-reclutador", { credentials: "include" });
        const data = await res.json();
        setAreas(data.areas || []);
        setJefesArea(data.jefes_area || []);
        setEmpleadosNormales(data.empleados_normales || []);
        // Guardar la cantidad total de jefes en formData para el paso 4
        setFormData({
          ...formData,
          jefesAreaLength: (data.jefes_area || []).length
        });
      } catch (err) {
        setAreas([]);
        setJefesArea([]);
        setEmpleadosNormales([]);
      } finally {
        setLoadingAreas(false);
      }
    };
    fetchInfo();
  }, []);

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
    const todos = jefesAreasSeleccionadas.length === jefesArea.length ? [] : jefesArea.map(j => j.puesto_trabajo);
    setJefesAreasSeleccionadas(todos);
    setFormData({ ...formData, jefesSeleccionados: todos });
  };

  const toggleEmpleado = (id) => {
    let nuevos;
    if (empleadosSeleccionados.some(emp => emp.id === id)) {
      nuevos = empleadosSeleccionados.filter(emp => emp.id !== id);
    } else {
      const empObj = empleadosNormales.find(e => e.id === id);
      if (!empObj) return;
      nuevos = [...empleadosSeleccionados, empObj];
    }
    setEmpleadosSeleccionados(nuevos);
    setFormData({ ...formData, empleadosSeleccionados: nuevos });
  };

  const validarYContinuar = () => {
    if (tipoEnvio === "area" && (!areasSeleccionadas || areasSeleccionadas.length === 0)) {
      setError("Debes seleccionar al menos un área.");
      return;
    }
    if (tipoEnvio === "jefes_especificos" && (!jefesAreasSeleccionadas || jefesAreasSeleccionadas.length === 0)) {
      setError("Debes seleccionar al menos un jefe de área.");
      return;
    }
    if (tipoEnvio === "empleados") {
      // No requiere validación extra, es todos
    }
    if (tipoEnvio === "emails") {
      const emailsValidos = (emails || []).filter(e => !!e && typeof e === "string" && e.trim() !== "");
      if ((!emailsValidos || emailsValidos.length === 0) && (!empleadosSeleccionados || empleadosSeleccionados.length === 0)) {
        setError("Debes ingresar al menos un email o seleccionar un empleado.");
        return;
      }
    }
    setError("");
    onNext();
  };

  return (
    <div className="text-black px-6 py-4 space-y-6">
      <h2 className="text-xl font-semibold">¿A quién está dirigida la encuesta?</h2>
      {loadingAreas ? (
        <div className="text-gray-500">Cargando áreas y empleados...</div>
      ) : (
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
                checked={jefesAreasSeleccionadas.length === jefesArea.length}
                onChange={toggleSeleccionarTodosJefes}
              />
              <span>Seleccionar todos</span>
            </label>
            {jefesArea.map((jefe) => (
              <label key={jefe.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-blue-500 w-4 h-4"
                  checked={jefesAreasSeleccionadas.includes(jefe.puesto_trabajo)}
                  onChange={() => toggleArea(jefe.puesto_trabajo, "jefes")}
                />
                <span>{jefe.nombre} {jefe.apellido} ({jefe.puesto_trabajo})</span>
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

        {/* Emails específicos o selección de empleados */}
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="destinatario"
            value="emails"
            checked={tipoEnvio === "emails"}
            onChange={handleTipoChange}
            className="accent-blue-600 w-5 h-5"
          />
          <span>Empleado particular (por email o selección)</span>
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
            <div className="flex flex-wrap gap-2 mb-2">
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
            <div className="border-t pt-2 mt-2">
              <div className="font-semibold mb-1">Seleccionar empleados:</div>
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                {empleadosNormales.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-blue-500 w-4 h-4"
                      checked={empleadosSeleccionados.some(e => e.id === emp.id)}
                      onChange={() => toggleEmpleado(emp.id)}
                    />
                    <span>{emp.nombre} {emp.apellido} ({emp.puesto_trabajo})</span>
                  </label>
                ))}
              </div>
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
            {areas.map((area) => (
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
      )}
      <div className="flex justify-between pt-6">
        <button onClick={onCancel} className="px-4 py-2 bg-red-400 hover:bg-red-500 text-white rounded">Cancelar</button>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">Atrás</button>
          <button onClick={validarYContinuar} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Siguiente</button>
        </div>
      </div>
      {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
    </div>
  );
}
