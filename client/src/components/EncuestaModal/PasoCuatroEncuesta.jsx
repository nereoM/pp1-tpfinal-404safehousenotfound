import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PasoCuatroEncuesta({ formData, onBack, onFinish, onCancel }) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const tipoLabel = {
    clima: "Clima Laboral",
    uso: "Uso de la Plataforma",
    desempeño: "Desempeño",
    capacitacion: "Capacitación y Desarrollo",
    diversidad: "Diversidad e Inclusión",
    otro: "Otro",
  };

  const formatFecha = (fecha) =>
    fecha ? format(new Date(fecha), "dd/MM/yyyy", { locale: es }) : "-";

  // --- NUEVO: función para armar el payload y enviar ---
  const toYYYYMMDD = (date) => {
    if (!date) return undefined;
    if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    const d = new Date(date);
    if (isNaN(d)) return undefined;
    return d.toISOString().slice(0, 10);
  };

  const handleFinalizar = async () => {
    setLoading(true);
    setError(null);
    try {
      // Armar el payload según tipoEnvio
      let payload = {
        tipo: formData.tipo || "",
        titulo: formData.titulo || "",
        descripcion: formData.descripcion || "",
        anonima: formData.anonima === "si" ? true : false,
        fecha_inicio: toYYYYMMDD(formData.fechas?.from) || "",
        fecha_fin: toYYYYMMDD(formData.fechas?.to) || "",
        preguntas: formData.preguntas || [],
      };
      let destinatariosValidos = false;
      if (formData.tipoEnvio === "area" && (formData.areas || []).length > 0) {
        payload.areas = formData.areas;
        destinatariosValidos = true;
      } else if (formData.tipoEnvio === "jefes_especificos" && (formData.jefesSeleccionadosDatos || []).length > 0) {
        const totalJefes = Number(formData.jefesAreaLength) || 0;
        const seleccionados = formData.jefesSeleccionadosDatos.length;
        if (totalJefes > 0 && seleccionados === totalJefes) {
          payload.todos_jefes = true;
          destinatariosValidos = true;
        } else if (seleccionados > 0) {
          payload.todos_jefes = false;
          payload.jefes = (formData.jefesSeleccionadosDatos || []).map(j => j.id);
          destinatariosValidos = payload.jefes.length > 0;
        }
      } else if (formData.tipoEnvio === "empleados") {
        payload.todos_empleados = true;
        destinatariosValidos = true;
      } else if (formData.tipoEnvio === "emails") {
        // Unificar emails directos y de empleados seleccionados
        let emailsDirectos = (formData.emails || []).filter(e => !!e && typeof e === "string" && e.trim() !== "");
        let emailsEmpleados = (formData.empleadosSeleccionados || [])
          .map(emp => {
            if (!emp) return null;
            if (typeof emp === "object" && emp.correo) return emp.correo;
            return null;
          })
          .filter(e => !!e && typeof e === "string" && e.trim() !== "");
        let todosEmails = [...emailsDirectos, ...emailsEmpleados];
        if (todosEmails.length > 0) {
          payload.emails = todosEmails;
          destinatariosValidos = true;
        }
      }
      if (!destinatariosValidos) {
        setError("Debes seleccionar al menos un destinatario válido (área, jefe, empleados o email).");
        setLoading(false);
        return;
      }
      // Llamada al backend
      let endpoint = "/api/crear-encuesta/reclutador";
      if (formData.rolUsuario === "manager") {
        endpoint = "/api/crear-encuesta/manager";
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la encuesta");
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onFinish();
        onCancel(); // Cierra el modal tras finalizar
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              n === 4 ? "bg-blue-500 text-white" : "bg-white text-black"
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-black">Resumen de la encuesta</h2>

      <div className="space-y-2 text-black">
        <p><strong>Tipo:</strong> {tipoLabel[formData.tipo] || formData.tipo}</p>
        <p><strong>Título:</strong> {formData.titulo}</p>
        <p><strong>Descripción:</strong> {formData.descripcion || "-"}</p>
        <p><strong>¿Anónima?:</strong> {formData.anonima === "si" ? "Sí" : "No"}</p>
        <p>
          <strong>Rango de fechas:</strong>{" "}
          {formData.fechas?.from
            ? `${formatFecha(formData.fechas.from)} hasta ${formatFecha(formData.fechas.to)}`
            : "No definido"}
        </p>
      </div>

      <hr className="my-4" />

      <h3 className="font-semibold text-black">Preguntas:</h3>
      {(formData.preguntas || []).length === 0 && (
        <p className="text-gray-600">No hay preguntas agregadas.</p>
      )}
      <ul className="space-y-2 text-black text-sm">
        {(formData.preguntas || []).map((p, i) => (
          <li key={i} className="border p-3 rounded bg-gray-50 space-y-1">
            <strong>{p.texto}</strong> <em className="text-gray-600">({p.tipo})</em>
            {p.opciones?.length > 0 && (
              <ul className="list-disc ml-6">
                {p.opciones.map((op, j) => (
                  <li key={j}>{op}</li>
                ))}
              </ul>
            )}
            {p.permitir_comentario && (
              <p className="text-xs text-gray-600">Incluye comentario adicional</p>
            )}
            {p.obligatoria && (
              <p className="text-xs text-red-500">Pregunta obligatoria</p>
            )}
          </li>
        ))}
      </ul>

      <h3 className="font-semibold text-black">Dirigido a:</h3>
      {/* Mostrar destinatarios según tipoEnvio y empleados seleccionados */}
      {formData.tipoEnvio === "area" && (
        <p className="text-black">
          <strong>Áreas:</strong> {(formData.areas || []).join(", ") || "No definido"}
        </p>
      )}
      {formData.tipoEnvio === "jefes_especificos" && (
        <div>
          <strong>Jefes específicos:</strong>
          <ul className="list-disc ml-6">
            {(formData.jefesSeleccionadosDatos || []).map(jefe => (
              <li key={jefe.id} className="text-black">{jefe.nombre} {jefe.apellido}</li>
            ))}
          </ul>
        </div>
      )}
      {formData.tipoEnvio === "empleados" && (
        <p className="text-black">
          <strong>Empleados:</strong> Todos
        </p>
      )}
      {formData.tipoEnvio === "emails" && (
        <div>
          <strong>Emails:</strong>
          <ul className="list-disc ml-6">
            {/* Mostrar emails directos */}
            {(formData.emails || []).filter(e => !!e && typeof e === "string" && e.trim() !== "").map((email, index) => (
              <li key={"email-"+index} className="text-black">{email}</li>
            ))}
            {/* Mostrar empleados seleccionados con la mejor info disponible */}
            {(formData.empleadosSeleccionados || []).map((emp, idx) => {
              if (!emp) return null;
              // Si es string (id), mostrar como id
              if (typeof emp === "string" || typeof emp === "number") {
                return <li key={"emp-"+idx} className="text-black">Empleado ID: {emp}</li>;
              }
              // Si es objeto, mostrar nombre, apellido, puesto y correo si existen
              const nombre = emp.nombre || emp.nombre_completo || "Empleado";
              const apellido = emp.apellido || "";
              const puesto = emp.puesto_trabajo ? `(${emp.puesto_trabajo})` : "";
              const correo = emp.correo ? `<${emp.correo}>` : "";
              return <li key={"emp-"+idx} className="text-black">{nombre} {apellido} {puesto} {correo}</li>;
            })}
          </ul>
        </div>
      )}
      {/* Si no hay ningún destinatario seleccionado */}
      {!(
        (formData.areas && formData.areas.length > 0) ||
        (formData.jefesSeleccionadosDatos && formData.jefesSeleccionadosDatos.length > 0) ||
        formData.todos_empleados ||
        (formData.emails && formData.emails.length > 0) ||
        (formData.empleadosSeleccionados && formData.empleadosSeleccionados.length > 0)
      ) && (
        <p className="text-red-600">No hay destinatarios seleccionados.</p>
      )}

      {/* Botones */}
      <div className="flex justify-between gap-2 pt-6">
        <button
          onClick={() => setMostrarConfirmacion(true)}
          className="px-4 py-2 bg-red-300 text-black rounded hover:bg-red-400"
          disabled={loading}
        >
          Cancelar
        </button>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
            disabled={loading}
          >
            Atrás
          </button>
          <button
            onClick={handleFinalizar}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Finalizar"}
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
      {success && <div className="text-green-600 font-medium mt-2">Encuesta creada correctamente</div>}

      {/* Modal de confirmación */}
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
