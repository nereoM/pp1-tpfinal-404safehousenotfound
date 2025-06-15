// ✅ ResponderEncuestaModal.jsx
import { useState } from "react";
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

  const preguntas = encuesta?.preguntas || [];
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

  const handleFinalizar = () => {
    alert("Respuestas enviadas:\n" + JSON.stringify(respuestas, null, 2));
    if (onResponderFinalizada && encuesta?.id) {
      onResponderFinalizada(encuesta.id);
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="space-y-6 max-w-3xl max-h-[90vh] overflow-auto text-black">
        <DialogTitle className="text-xl font-bold">
          {encuesta?.titulo || "Responder Encuesta"}
        </DialogTitle>

        {preguntaActual && (
          <div className="space-y-4">
            <h2 className="text-md font-semibold">
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
              <div className="space-y-2">
                {preguntaActual.tipo === "checkbox" && (
                  <p className="text-sm text-gray-500 italic">(Podés seleccionar más de una opción)</p>
                )}
                {preguntaActual.opciones.map((op, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type={preguntaActual.tipo}
                      name="opcion"
                      value={op}
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
                    <label>{op}</label>
                  </div>
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
