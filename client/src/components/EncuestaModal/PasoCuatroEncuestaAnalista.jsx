import { useState } from "react";

export default function PasoCuatroEncuestaAnalista({ formData, onBack, onFinish, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      const payload = {
        tipo: formData.tipo || "general",
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        anonima: false,
        fecha_inicio: formData.fechas?.from?.toISOString().split("T")[0],
        fecha_fin: formData.fechas?.to?.toISOString().split("T")[0],
        preguntas: (formData.preguntas || []).map(p => ({
          texto: p.texto,
          tipo:
            p.tipo === "opcion unica"
              ? "unica_opcion"
              : p.tipo === "opcion multiple"
              ? "opcion_multiple"
              : "respuesta_libre",
          opciones: p.opciones || [],
          es_requerida: !!p.obligatoria,
        }))
      };

      // Asignación dinámica
      if (formData.tipoEnvio === "empleados") {
        payload.todos_empleados = true;
      } else if (formData.tipoEnvio === "jefes_especificos") {
        payload.todos_jefes = false;
        payload.emails = (formData.jefesSeleccionadosDatos || []).map(j => j.correo);
      } else if (formData.tipoEnvio === "emails") {
        const directos = formData.emails || [];
        const seleccionados = (formData.empleadosSeleccionados || []).map(e => e.correo);
        payload.emails = [...directos, ...seleccionados];
      } else if (formData.tipoEnvio === "area") {
        payload.areas = formData.areas || [];
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crear-encuesta/reclutador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear encuesta");
      }

      onFinish();
    } catch (err) {
      console.error("Error al crear encuesta:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-black">
      <h2 className="text-xl font-semibold">Resumen de la encuesta</h2>

      <p><strong>Título:</strong> {formData.titulo}</p>
      <p><strong>Descripción:</strong> {formData.descripcion || "-"}</p>

      <h3 className="font-semibold">Destinatarios:</h3>
      {formData.tipoEnvio === "empleados" && <p>Todos los empleados (excepto jefes)</p>}

      {formData.tipoEnvio === "emails" && (
        <>
          <p><strong>Correos:</strong></p>
          <ul className="list-disc ml-6">
            {(formData.emails || []).map((email, i) => <li key={i}>{email}</li>)}
          </ul>
          <p className="mt-2"><strong>Empleados seleccionados:</strong></p>
          <ul className="list-disc ml-6">
            {(formData.empleadosSeleccionados || []).map((e, i) => (
              <li key={i}>{e.nombre} {e.apellido} ({e.puesto_trabajo})</li>
            ))}
          </ul>
        </>
      )}

      {formData.tipoEnvio === "area" && (
        <>
          <p><strong>Áreas seleccionadas:</strong></p>
          <ul className="list-disc ml-6">
            {(formData.areas || []).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </>
      )}

      {formData.tipoEnvio === "jefes_especificos" && (
        <>
          <p><strong>Jefes seleccionados:</strong></p>
          <ul className="list-disc ml-6">
            {(formData.jefesSeleccionadosDatos || []).map((j, i) => (
              <li key={i}>{j.nombre} {j.apellido} ({j.puesto_trabajo})</li>
            ))}
          </ul>
        </>
      )}

      <h3 className="font-semibold">Preguntas:</h3>
      <ul className="space-y-2 text-sm">
        {(formData.preguntas || []).map((p, i) => (
          <li key={i} className="border p-3 rounded bg-gray-50">
            <strong>{p.texto}</strong> ({p.tipo})
            {p.opciones?.length > 0 && (
              <ul className="list-disc ml-6">
                {p.opciones.map((op, j) => <li key={j}>{op}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className="flex justify-between pt-4">
        <button onClick={onCancel} className="bg-red-300 px-4 py-2 rounded">Cancelar</button>
        <div className="flex gap-2">
          <button onClick={onBack} className="bg-gray-300 px-4 py-2 rounded">Atrás</button>
          <button onClick={handleFinalizar} className="bg-green-600 text-white px-4 py-2 rounded">
            {loading ? "Enviando..." : "Finalizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
