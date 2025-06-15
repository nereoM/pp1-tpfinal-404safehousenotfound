import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";
import { VerEncuestaModal } from "./VerEncuestaModal";

export function GestionarEncuestasModal({ open, onOpenChange }) {
  const [encuestas, setEncuestas] = useState([]);
  const [modalVerEncuesta, setModalVerEncuesta] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);

  useEffect(() => {
    if (open) {
      setEncuestas([
        {
          id: 1,
          titulo: "Clima Laboral - Q2",
          descripcion: "Encuesta para evaluar el ambiente laboral del segundo trimestre.",
          fecha_inicio: "2025-06-01",
          fecha_fin: "2025-06-20",
          respuestas: 4,
          total: 15,
        },
        {
          id: 2,
          titulo: "Uso de la Plataforma",
          descripcion: "Evaluación de la experiencia de los usuarios con la app.",
          fecha_inicio: "2025-06-05",
          fecha_fin: "2025-06-30",
          respuestas: 9,
          total: 15,
        },
      ]);
    }
  }, [open]);

  const handleCerrarEncuesta = (id) => {
    setEncuestas((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl space-y-4">
        <DialogTitle className="text-xl font-bold text-black">Gestionar Encuestas</DialogTitle>

        <div className="space-y-4 max-h-[60vh] overflow-auto">
          {encuestas.map((encuesta) => (
            <div
              key={encuesta.id}
              className="border rounded-lg p-4 shadow flex justify-between items-start gap-4"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-black">{encuesta.titulo}</h3>
                <p className="text-sm text-gray-700">{encuesta.descripcion}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Publicación: {encuesta.fecha_inicio} | Cierre: {encuesta.fecha_fin}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    onClick={() => {
                      setEncuestaSeleccionada(encuesta);
                      setModalVerEncuesta(true);
                    }}
                  >
                    Ver encuesta
                  </button>
                  <button
                    className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
                    onClick={() => handleCerrarEncuesta(encuesta.id)}
                  >
                    Cerrar encuesta
                  </button>
                </div>
              </div>
            </div>
          ))}

          {encuestas.length === 0 && (
            <div className="text-sm text-gray-500 text-center pt-10">
              No hay encuestas activas.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded-md text-white text-sm bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </button>
        </div>
      </DialogContent>

      <VerEncuestaModal
        open={modalVerEncuesta}
        onClose={() => setModalVerEncuesta(false)}
        encuesta={encuestaSeleccionada}
      />
    </Dialog>
  );
}
