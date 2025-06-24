import { useState } from "react";
import MensajeAlerta from "../MensajeAlerta";

export default function PasoCuatroEncuestaManager({ formData, onBack, onFinish, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [ejecutado, setEjecutado] = useState(false); // Previene doble envío
  const [encuestaCreada, setEncuestaCreada] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

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
          es_requerida: !!p.es_requerida,
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

      setEncuestaCreada(true);

      setTimeout(() => {
        onCancel(); // cerrar modal o redirigir
      }, 2000);
    } catch (err) {
      console.error("Error al crear encuesta:", err.message);
      setEjecutado(false); // Permite reintentar si falla
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 relative text-black">
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
          <li key={i} className="border p-3 rounded bg-gray-50 space-y-1">
            <strong>{p.texto}</strong> ({p.tipo})
            {p.opciones?.length > 0 && (
              <ul className="list-disc ml-6">
                {p.opciones.map((op, j) => <li key={j}>{op}</li>)}
              </ul>
            )}
            {p.es_requerida && (
              <p className="text-xs text-red-500">Pregunta obligatoria</p>
            )}
          </li>
        ))}
      </ul>

      {/* Mensaje de éxito justo antes de los botones */}
      {encuestaCreada && (
        <MensajeAlerta
          texto="Encuesta creada correctamente"
          tipo="success"
          className="mb-4"
        />
      )}

      {/* Botones */}
      <div className="flex justify-between pt-6">
        <button
          onClick={() => setMostrarConfirmacion(true)}
          className="bg-red-300 px-4 py-2 rounded hover:bg-red-400"
        >
          Cancelar
        </button>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Atrás
          </button>
          <button
            onClick={handleFinalizar}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={loading || encuestaCreada}
          >
            {loading ? "Enviando..." : "Finalizar"}
          </button>
        </div>
      </div>

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
