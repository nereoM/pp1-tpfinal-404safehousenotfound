// ✅ ResponderEncuestaModal.jsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";

export default function ResponderEncuestaModal({
  open,
  onOpenChange,
  encuesta,
  onResponderFinalizada,
}) {
  const [preguntaIndex, setPreguntaIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [error, setError] = useState(null);
  const [preguntas, setPreguntas] = useState([]);

  useEffect(() => {
    if (open && encuesta?.id_encuesta) {
      fetch(`http://localhost:5000/api/encuesta-asignada/${encuesta.id_encuesta}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setPreguntas(data.preguntas || []);
        })
        .catch((err) => {
          console.error("Error al cargar preguntas de la encuesta", err);
          setPreguntas([]);
        });
    }
  }, [open, encuesta?.id_encuesta]);

  const preguntaActual = preguntas[preguntaIndex];
  const esUltima = preguntaIndex === preguntas.length - 1;

  const handleClose = () => {
    setPreguntaIndex(0);
    setRespuestas({});
    setError(null);
    onOpenChange(false);
  };

  const handleRespuesta = (respuesta) => {
    setRespuestas({ ...respuestas, [preguntaActual.texto]: respuesta });
    setError(null);
  };

  const handleMultipleRespuesta = (opcion) => {
    const prev = respuestas[preguntaActual.texto] || [];
    const nueva = prev.includes(opcion)
      ? prev.filter((o) => o !== opcion)
      : [...prev, opcion];
    setRespuestas({ ...respuestas, [preguntaActual.texto]: nueva });
    setError(null);
  };

  const handleComentario = (comentario) => {
    setRespuestas({
      ...respuestas,
      [`${preguntaActual.texto}_comentario`]: comentario,
    });
  };

  const validarRespuesta = () => {
    if (!preguntaActual.obligatoria) return true;
    const respuesta = respuestas[preguntaActual.texto];
    if (preguntaActual.tipo === "checkbox") return Array.isArray(respuesta) && respuesta.length > 0;
    return !!respuesta;
  };

  const handleSiguiente = () => {
    if (!validarRespuesta()) {
      setError("Esta pregunta es obligatoria.");
      return;
    }
    if (esUltima) handleFinalizar();
    else setPreguntaIndex((prev) => prev + 1);
  };

  const handleFinalizar = async () => {
    const respuestasFormateadas = Object.entries(respuestas)
      .filter(([k]) => !k.endsWith("_comentario"))
      .map(([preguntaTexto, respuesta]) => {
        const pregunta = preguntas.find((p) => p.texto === preguntaTexto);
        return {
          id_pregunta: pregunta?.id,
          respuesta,
          comentario: respuestas[`${preguntaTexto}_comentario`] ?? null
        };
      });

    try {
      const res = await fetch(`http://localhost:5000/api/responder-encuesta/${encuesta.id_encuesta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ respuestas: respuestasFormateadas }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Error al enviar respuestas");
        return;
      }

      if (onResponderFinalizada) {
        onResponderFinalizada(encuesta.id_encuesta);
      }
      handleClose();
    } catch (err) {
      console.error("Error al enviar respuestas:", err);
      setError("Error de conexión al enviar respuestas");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="space-y-6 max-w-3xl max-h-[90vh] overflow-auto text-black"
        aria-describedby="descripcion-responder-encuesta"
      >
        <p id="descripcion-responder-encuesta" className="sr-only">
          Formulario de respuesta para encuesta asignada.
        </p>

        <DialogTitle className="text-xl font-bold">
          {encuesta?.titulo || "Responder Encuesta"}
        </DialogTitle>

        {preguntaActual && (
          <div className="space-y-4">
            <h2 className="text-md font-semibold mb-2">
              {preguntaActual.texto}
              {preguntaActual.obligatoria && <span className="text-red-600"> *</span>}
            </h2>

            {preguntaActual.tipo === "texto" ? (
              <textarea
                className="w-full p-2 border rounded"
                placeholder="Escribí tu respuesta"
                onChange={(e) => handleRespuesta(e.target.value)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {preguntaActual.tipo === "checkbox" && (
                  <div className="col-span-2 text-sm text-gray-500 italic">
                    (Podés seleccionar más de una opción)
                  </div>
                )}
                {preguntaActual.opciones.map((op, idx) => (
                  <label key={idx} className="flex items-center gap-2 border rounded px-3 py-2 shadow-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type={preguntaActual.tipo}
                      name="opcion"
                      value={op}
                      className="accent-blue-600"
                      checked={
                        preguntaActual.tipo === "checkbox"
                          ? respuestas[preguntaActual.texto]?.includes(op)
                          : respuestas[preguntaActual.texto] === op
                      }
                      onChange={() =>
                        preguntaActual.tipo === "checkbox"
                          ? handleMultipleRespuesta(op)
                          : handleRespuesta(op)
                      }
                    />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
            )}

            {preguntaActual.comentario && (
              <div>
                <label className="block mb-1 text-sm">
                  ¿Deseás agregar un comentario?
                </label>
                <textarea
                  className="w-full border p-2 rounded"
                  rows={4}
                  onChange={(e) => handleComentario(e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={handleClose}
              >
                Cancelar
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${
                  esUltima ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={handleSiguiente}
              >
                {esUltima ? "Finalizar" : "Siguiente"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
