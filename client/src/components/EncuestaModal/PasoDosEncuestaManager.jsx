import { useState, useEffect } from "react";

export default function PasoDosEncuestaManager({ formData, setFormData, onNext, onBack }) {
  const [envioATodos, setEnvioATodos] = useState(formData.envioATodos ?? true);
  const [emailInput, setEmailInput] = useState("");
  const [correos, setCorreos] = useState(formData.correosAnalistas || []);
  const [reclutadores, setReclutadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Obtener lista de reclutadores del backend
    const fetchReclutadores = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/mis-reclutadores", { credentials: "include" });
        if (!res.ok) throw new Error("Error al obtener reclutadores");
        let data = await res.json();
        console.log("[PasoDosEncuestaManager] Datos crudos de reclutadores del backend:", data);
        let lista = Array.isArray(data) ? data : (Array.isArray(data.reclutadores) ? data.reclutadores : []);
        lista = lista.map(emp => ({
          ...emp,
          correo: emp.correo || emp.email || emp.username || ""
        }));
        setReclutadores(lista);
      } catch (err) {
        setError("No se pudieron cargar los reclutadores");
        setReclutadores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReclutadores();
  }, []);

  useEffect(() => {
    if (!envioATodos) {
      const seleccionados = reclutadores.filter(r => correos.includes(r.correo));
      console.log("[PasoDosEncuestaManager] Reclutadores seleccionados:", seleccionados);
      setFormData({
        ...formData,
        correosAnalistas: correos,
        correosAnalistasDatos: seleccionados,
      });
    } else {
      setFormData({
        ...formData,
        correosAnalistas: [],
        correosAnalistasDatos: [],
      });
    }
    // eslint-disable-next-line
  }, [correos, envioATodos, reclutadores]);

  const handleOpcionCambio = (valor) => {
    setEnvioATodos(valor);
    if (valor) {
      setCorreos([]);
    }
    setFormData({
      ...formData,
      envioATodos: valor,
      correosAnalistas: valor ? [] : correos,
      correosAnalistasDatos: valor ? [] : reclutadores.filter(r => correos.includes(r.correo)),
    });
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const nuevoCorreo = emailInput.trim();
      if (nuevoCorreo && !correos.includes(nuevoCorreo)) {
        const nuevos = [...correos, nuevoCorreo];
        setCorreos(nuevos);
        setFormData({ ...formData, correosAnalistas: nuevos });
      }
      setEmailInput("");
    }
  };

  const eliminarCorreo = (correo) => {
    const nuevos = correos.filter((c) => c !== correo);
    setCorreos(nuevos);
    setFormData({ ...formData, correosAnalistas: nuevos });
  };

  const handleSiguiente = () => {
    if (!envioATodos && correos.length === 0) {
      alert("Debes ingresar al menos un correo.");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6 text-gray-800">
      <h2 className="text-xl font-semibold">Destinatarios de la encuesta</h2>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="envio"
            checked={envioATodos}
            onChange={() => handleOpcionCambio(true)}
            className="accent-blue-600 w-5 h-5"
          />
          <span className="text-base">Enviar a <strong>todos los analistas</strong></span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="envio"
            checked={!envioATodos}
            onChange={() => handleOpcionCambio(false)}
            className="accent-blue-600 w-5 h-5"
          />
          <span className="text-base">Enviar a <strong>algunos analistas</strong></span>
        </label>

        {!envioATodos && (
          <div className="ml-6 space-y-2">
            {/* Mostrar error si no se pudieron cargar reclutadores */}
            {error && <div className="text-red-600">{error}</div>}
            {loading ? (
              <div className="text-gray-500">Cargando reclutadores...</div>
            ) : (
              <>
                <div className="mb-2">
                  <span className="font-semibold">Seleccionar reclutadores:</span>
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-1 mt-1">
                    {reclutadores.length === 0 && <span className="text-gray-500">No hay reclutadores disponibles.</span>}
                    {reclutadores.map((rec) => (
                      <label key={rec.id || rec.correo} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-blue-500 w-4 h-4"
                          checked={correos.includes(rec.correo)}
                          onChange={() => {
                            let nuevos;
                            if (correos.includes(rec.correo)) {
                              nuevos = correos.filter(c => c !== rec.correo);
                            } else {
                              nuevos = [...correos, rec.correo];
                            }
                            setCorreos(nuevos);
                          }}
                        />
                        <span>{rec.nombre} {rec.apellido} ({rec.correo})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">O agregar email manualmente:</div>
                <input
                  type="text"
                  placeholder="Presioná Enter para agregar"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                />
                <div className="flex flex-wrap gap-2">
                  {correos.map((correo, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-2"
                    >
                      <span>{correo}</span>
                      <button
                        onClick={() => eliminarCorreo(correo)}
                        className="text-red-500 hover:text-red-700 text-sm font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Atrás
        </button>
        <button
          onClick={handleSiguiente}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
