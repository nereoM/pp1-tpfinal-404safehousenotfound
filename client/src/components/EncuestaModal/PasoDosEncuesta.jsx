import { useEffect, useState } from "react";

const mapeoArea = {
  "Tecnología y Desarrollo": "Jefe de Tecnología y Desarrollo",
  "Administración y Finanzas": "Jefe de Administración y Finanzas",
  "Comercio y Ventas": "Jefe Comercial y de Ventas",
  "Marketing y Comunicación": "Jefe de Marketing y Comunicación",
  "Industria y Producción": "Jefe de Industria y Producción",
  "Servicios Generales y Gastronomía": "Jefe de Servicios Generales y Gastronomía",
};

export default function PasoDosEncuesta({ formData, setFormData, onNext, onBack, onCancel }) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [areaJefe, setAreaJefe] = useState(null);
  const [puestosAsignados, setPuestosAsignados] = useState([]);

  const handleChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor });
  };

  console.log("Intentando fetch con cookies:", document.cookie);

  useEffect(() => {
    fetch("/api/area/info", { credentials: "include" })
      .then(async (res) => {
        console.log("🔁 Status:", res.status);
        const text = await res.text();
        console.log("🔍 Response texto:", text);

        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Respuesta no válida del servidor");
        }

        return JSON.parse(text);
      })
      .then((data) => {
        setAreaJefe(data.mi_puesto_trabajo);
        setPuestosAsignados(data.puestos_area || []);
      })
      .catch((err) => {
        console.error("🔥 Error al obtener el área del jefe:", err);
        setAreaJefe("Error");
      });
  }, []);

  const opcionesArea = Object.keys(mapeoArea);

  const puedeContinuar =
    (formData.destinatario === "empleado" && formData.correo?.trim()) ||
    (formData.destinatario === "area" && formData.area) ||
    (formData.destinatario === "puesto" && formData.puesto);

  if (areaJefe === null) {
    return <div className="text-center text-gray-600 mt-6">Cargando área del jefe...</div>;
  }

  if (areaJefe === "Error") {
    return (
      <div className="text-center text-red-600 mt-6">
        ❌ No se pudo obtener la información del área. Verificá tus permisos o conexión.
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              n === 2 ? "bg-blue-500 text-white" : "bg-white text-black"
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      <label className="block text-sm font-medium text-black">
        ¿A quién está dirigida la encuesta?
      </label>
      <div className="space-y-2">
        {["empleado", "area", "puesto"].map((op) => (
          <label key={op} className="flex items-center gap-2 text-black">
            <input
              type="radio"
              value={op}
              checked={formData.destinatario === op}
              onChange={() => handleChange("destinatario", op)}
            />
            {op === "empleado"
              ? "Empleado"
              : op === "area"
              ? "Área de trabajo"
              : "Puesto de trabajo"}
          </label>
        ))}
      </div>

      {formData.destinatario === "empleado" && (
        <div>
          <label className="block text-sm font-medium text-black">
            Ingresá el correo del empleado
          </label>
          <input
            type="email"
            value={formData.correo || ""}
            onChange={(e) => handleChange("correo", e.target.value)}
            className="w-full border p-2 rounded text-black"
            placeholder="correo@empresa.com"
          />
        </div>
      )}

      {formData.destinatario === "area" && (
        <div>
          <label className="block text-sm font-medium text-black">Seleccioná el área</label>
          <select
            value={formData.area || ""}
            onChange={(e) => handleChange("area", e.target.value)}
            className="w-full border p-2 rounded text-black"
          >
            <option value="" disabled>Elegí una área</option>
            {opcionesArea.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      )}

      {formData.destinatario === "puesto" && (
        <div>
          <label className="block text-sm font-medium text-black">Seleccioná el puesto</label>
          <select
            value={formData.puesto || ""}
            onChange={(e) => handleChange("puesto", e.target.value)}
            className="w-full border p-2 rounded text-black"
            disabled={puestosAsignados.length === 0}
          >
            <option value="" disabled>
              {puestosAsignados.length === 0 ? "Cargando puestos..." : "Elegí un puesto"}
            </option>
            {puestosAsignados.map((puesto) => (
              <option key={puesto} value={puesto}>
                {puesto}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-between gap-2 mt-4">
        <button
          onClick={() => setMostrarConfirmacion(true)}
          className="px-4 py-2 bg-red-300 text-black rounded hover:bg-red-400"
        >
          Cancelar
        </button>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
          >
            Atrás
          </button>
          <button
            onClick={() => {
              const nuevaData = { ...formData };
              if (nuevaData.destinatario === "area") {
                nuevaData.area = mapeoArea[nuevaData.area] || nuevaData.area;
              }
              setFormData(nuevaData);
              onNext();
            }}
            disabled={!puedeContinuar}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {mostrarConfirmacion && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg text-center space-y-4 w-80">
            <p className="text-black font-medium">¿Estás seguro que querés cancelar?</p>
            <p className="text-sm text-gray-700">Perderás los pasos ya hechos.</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
              >
                No, volver
              </button>
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  onCancel();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}