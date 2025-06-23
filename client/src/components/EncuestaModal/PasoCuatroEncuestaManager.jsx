import { useState } from "react";

export default function PasoCuatroEncuestaManager({ formData, onBack, onFinish, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [ejecutado, setEjecutado] = useState(false); // Previene doble envío

  const handleFinalizar = async () => {
    if (ejecutado) return;
    setEjecutado(true);
    setLoading(true);

    try {
      const payload = {
        tipo: formData.tipo || "general",
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        anonima: false,
        fecha_inicio: formData.fechas?.from?.toISOString().split("T")[0],
        fecha_fin: formData.fechas?.to?.toISOString().split("T")[0],
        todos_reclutadores: formData.envioATodos,
        emails: formData.envioATodos ? [] : formData.correosAnalistas,
        preguntas: (formData.preguntas || []).map((p) => ({
          texto: p.texto,
          tipo:
            p.tipo === "opcion unica"
              ? "unica_opcion"
              : p.tipo === "opcion multiple"
              ? "opcion_multiple"
              : "respuesta_libre",
          opciones: p.opciones || [],
          es_requerida: !!p.obligatoria,
        })),
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crear-encuesta/manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear encuesta");
      }

      onCancel();
    } catch (err) {
      console.error("Error al crear encuesta:", err.message);
      setEjecutado(false); // Permite reintentar si falla
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-black">
      <h2 className="text-xl font-semibold">Resumen de la encuesta</h2>

      <p><strong>Título:</strong> {formData.titulo}</p>
      <p><strong>Descripción:</strong> {formData.descripcion || "-"}</p>
      <p><strong>Destinatarios:</strong> {formData.envioATodos ? "Todos los analistas" : "Analistas seleccionados"}</p>

      {!formData.envioATodos && (
        <ul className="list-disc ml-6">
          {(formData.correosAnalistas || []).map((correo, i) => (
            <li key={i}>{correo}</li>
          ))}
        </ul>
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
          <button
            onClick={handleFinalizar}
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Finalizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
