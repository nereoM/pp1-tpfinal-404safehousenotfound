import { useEffect, useState } from "react";
import MensajeAlerta from "../MensajeAlerta";

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
  const [empleadosArea, setEmpleadosArea] = useState([]);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [errores, setErrores] = useState({});
  const [bloqueoBoton, setBloqueoBoton] = useState(false);

  const handleChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor });
    setErrores({ ...errores, [campo]: null });
  };

  useEffect(() => {
    fetch("/api/area/info", { credentials: "include" })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Respuesta no válida del servidor");
        }
        return JSON.parse(text);
      })
      .then((data) => {
        setAreaJefe(data.mi_puesto_trabajo);
        setPuestosAsignados(data.puestos_area || []);
        setEmpleadosArea(data.empleados_area || []);
        setFormData((prev) => ({ ...prev, area: data.mi_puesto_trabajo }));
      })
      .catch((err) => {
        console.error("🔥 Error al obtener el área del jefe:", err);
        setAreaJefe("Error");
      });
  }, []);

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
      {errores.destinatario && <p className="text-sm text-red-600">{errores.destinatario}</p>}

      {formData.destinatario === "empleado" && (
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Seleccioná los empleados
          </label>
          <div className="border p-2 rounded max-h-60 overflow-y-auto bg-white space-y-1">
            {empleadosArea.length === 0 ? (
              <p className="text-sm text-gray-500">No hay empleados disponibles.</p>
            ) : (
              empleadosArea.map((emp) => (
                <label
                  key={emp.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 rounded cursor-pointer text-black"
                >
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    value={emp.id}
                    checked={formData.empleadosSeleccionados?.includes(emp.id)}
                    onChange={(e) => {
                      const id = emp.id;
                      const correo = emp.correo;
                      let seleccionados = formData.empleadosSeleccionados || [];
                      let emails = formData.emails || [];
                      let datos = formData.empleadosDatos || [];

                      if (e.target.checked) {
                        seleccionados = [...seleccionados, id];
                        emails = [...emails, correo];
                        datos = [
                          ...datos,
                          {
                            id,
                            nombre: emp.nombre,
                            apellido: emp.apellido,
                            email: emp.correo,
                          },
                        ];
                      } else {
                        seleccionados = seleccionados.filter((eid) => eid !== id);
                        emails = emails.filter((mail) => mail !== correo);
                        datos = datos.filter((e) => e.id !== id);
                      }

                      setFormData({
                        ...formData,
                        empleadosSeleccionados: seleccionados,
                        emails,
                        empleadosDatos: datos,
                      });
                    }}
                  />
                  {emp.nombre} {emp.apellido} —{" "}
                  <span className="text-sm text-gray-600">{emp.puesto_trabajo}</span>
                </label>
              ))
            )}
          </div>
          {errores.empleado && <p className="text-sm text-red-600 mt-1">{errores.empleado}</p>}
        </div>
      )}

      {formData.destinatario === "area" && (
        <div>
          <label className="block text-sm font-medium text-black">Área de trabajo</label>
          <p className="text-black p-2 border rounded bg-gray-100">{areaJefe}</p>
          <input type="hidden" value={areaJefe} name="area" />
          {errores.area && <p className="text-sm text-red-600 mt-1">{errores.area}</p>}
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
          {errores.puesto && <p className="text-sm text-red-600 mt-1">{errores.puesto}</p>}
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
            disabled={bloqueoBoton}
            onClick={() => {
              const nuevosErrores = {};

              if (!formData.destinatario) {
                nuevosErrores.destinatario = "Seleccioná a quién va dirigida la encuesta.";
              }

              if (
                formData.destinatario === "empleado" &&
                (!formData.empleadosSeleccionados || formData.empleadosSeleccionados.length === 0)
              ) {
                nuevosErrores.empleado = "Seleccioná al menos un empleado.";
              }

              if (formData.destinatario === "area" && !formData.area) {
                nuevosErrores.area = "No se pudo obtener el área de trabajo. Verificá tu conexión.";
              }

              if (formData.destinatario === "puesto" && !formData.puesto) {
                nuevosErrores.puesto = "Por favor seleccioná un puesto.";
              }

              if (Object.keys(nuevosErrores).length > 0) {
                setErrores(nuevosErrores);
                setMensajeAlerta(Object.values(nuevosErrores)[0]);
                setBloqueoBoton(true);
                setTimeout(() => setBloqueoBoton(false), 3000);
                return;
              }

              setErrores({});
              setMensajeAlerta(null);

              const nuevaData = { ...formData };
              if (nuevaData.destinatario === "area") {
                nuevaData.area = mapeoArea[nuevaData.area] || nuevaData.area;
              }

              setFormData(nuevaData);
              onNext();
            }}
            className={`px-4 py-2 rounded text-white ${
              bloqueoBoton ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
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

      {mensajeAlerta && (
        <MensajeAlerta
          mensaje={mensajeAlerta}
          tipo="error"
          onClose={() => setMensajeAlerta(null)}
        />
      )}
    </div>
  );
}
