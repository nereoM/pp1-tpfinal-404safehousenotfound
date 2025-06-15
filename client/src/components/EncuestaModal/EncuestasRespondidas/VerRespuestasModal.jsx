import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";

export function VerRespuestasModal({ open, onOpenChange, encuesta }) {
  if (!encuesta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl space-y-4">
        <DialogTitle className="text-center text-2xl font-bold">
          Respuestas de: {encuesta.titulo}
        </DialogTitle>

        {encuesta.respuestas?.length > 0 ? (
          <div className="space-y-4 max-h-[65vh] overflow-auto">
            {encuesta.respuestas.map((r, idx) => (
              <div
                key={idx}
                className="rounded-lg border bg-white p-4 shadow space-y-2"
              >
                <h4 className="font-semibold text-black">{r.pregunta}</h4>

                {Array.isArray(r.respuesta) ? (
                  <ul className="list-disc ml-6 text-gray-800 text-sm">
                    {r.respuesta.map((op, i) => (
                      <li key={i}>{op}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-800">{r.respuesta}</p>
                )}

                {r.comentario && (
                  <p className="text-sm text-gray-600 italic">
                    Comentario: {r.comentario}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No hay respuestas registradas.</p>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
