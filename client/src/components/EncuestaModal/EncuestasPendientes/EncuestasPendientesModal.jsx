import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";
import ResponderEncuestaModal from "./ResponderEncuestaModal";

export function EncuestasPendientesModal({ open, onOpenChange }) {
  const [encuestas, setEncuestas] = useState([]);
  const [modalResponder, setModalResponder] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);

  useEffect(() => {
    if (open) {
      // Mock con preguntas completas
      setEncuestas([
        {
          id: 101,
          titulo: "Encuesta de Clima Laboral",
          descripcion: "Queremos conocer cómo te sentís en tu lugar de trabajo.",
          preguntas: [
            {
              texto: "¿Cómo evaluás el ambiente laboral?",
              tipo: "radio",
              opciones: ["Excelente", "Bueno", "Regular", "Malo"],
              obligatoria: true,
              comentario: true,
            },
            {
              texto: "¿Qué mejorarías?",
              tipo: "texto",
              obligatoria: false,
              comentario: false,
            },
            {
              texto: "¿Qué áreas te gustaría fortalecer?",
              tipo: "checkbox",
              opciones: ["Comunicación", "Trabajo en equipo", "Liderazgo", "Motivación"],
              obligatoria: true,
              comentario: false,
            },
            {
              texto: "¿Con qué frecuencia recibís feedback de tus superiores?",
              tipo: "radio",
              opciones: ["Semanalmente", "Mensualmente", "Rara vez", "Nunca"],
              obligatoria: true,
              comentario: false,
            },
            {
              texto: "¿Recomendarías esta empresa como un buen lugar para trabajar?",
              tipo: "radio",
              opciones: ["Sí", "No"],
              obligatoria: true,
              comentario: true,
            },
          ],
        },
        {
          id: 102,
          titulo: "Satisfacción con Capacitación",
          descripcion: "Tu opinión sobre las oportunidades de aprendizaje.",
          preguntas: [
            {
              texto: "¿Participaste en alguna capacitación este trimestre?",
              tipo: "radio",
              opciones: ["Sí", "No"],
              obligatoria: true,
              comentario: false,
            },
            {
              texto: "¿Qué temas te gustaría que se incluyan en próximas capacitaciones?",
              tipo: "texto",
              obligatoria: false,
              comentario: false,
            },
          ],
        },
        {
          id: 103,
          titulo: "Evaluación de Herramientas de Trabajo",
          descripcion: "Queremos conocer tu experiencia con las herramientas digitales.",
          preguntas: [
            {
              texto: "¿Qué tan satisfecho estás con las herramientas actuales?",
              tipo: "radio",
              opciones: ["Muy satisfecho", "Satisfecho", "Insatisfecho"],
              obligatoria: true,
              comentario: false,
            },
            {
              texto: "¿Qué herramienta mejorarías o cambiarías?",
              tipo: "texto",
              obligatoria: false,
              comentario: false,
            },
          ],
        },
      ]);
    }
  }, [open]);

  const quitarEncuestaRespondida = (idRespondida) => {
    setEncuestas((prev) => prev.filter((e) => e.id !== idRespondida));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl space-y-4">
        <DialogTitle className="text-xl font-bold text-black">
          Encuestas Pendientes
        </DialogTitle>

        {encuestas.length === 0 ? (
          <div className="text-gray-500 text-center pt-6">
            No tenés encuestas pendientes por responder.
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-auto">
            {encuestas.map((encuesta) => (
              <div
                key={encuesta.id}
                className="border rounded-lg p-4 shadow flex justify-between items-start gap-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    {encuesta.titulo}
                  </h3>
                  <p className="text-sm text-gray-700">{encuesta.descripcion}</p>
                </div>
                <button
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm h-fit"
                  onClick={() => {
                    setEncuestaSeleccionada(encuesta);
                    setModalResponder(true);
                  }}
                >
                  Responder
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded-md text-white text-sm bg-red-600 hover:bg-red-700"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </button>
        </div>

        <ResponderEncuestaModal
          open={modalResponder}
          onOpenChange={setModalResponder}
          encuesta={encuestaSeleccionada}
          onResponderFinalizada={quitarEncuestaRespondida}
        />
      </DialogContent>
    </Dialog>
  );
}
