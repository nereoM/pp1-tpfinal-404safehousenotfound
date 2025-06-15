import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";
import { VerRespuestasModal } from "./VerRespuestasModal";

export function EncuestasRespondidasModal({ open, onOpenChange, encuestas }) {
  const [verRespuestasOpen, setVerRespuestasOpen] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl space-y-4">
          <DialogTitle className="text-center text-2xl font-bold">
            Encuestas Respondidas
          </DialogTitle>

          {encuestas.length === 0 ? (
            <p className="text-center text-gray-500">No hay encuestas respondidas aún.</p>
          ) : (
            <div className="space-y-4 max-h-[65vh] overflow-auto">
              {encuestas.map((encuesta) => (
                <div
                  key={encuesta.id}
                  className="rounded-lg border bg-white p-4 shadow flex justify-between items-start"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-black">{encuesta.titulo}</h3>
                    <p className="text-sm text-gray-700">{encuesta.descripcion}</p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setEncuestaSeleccionada(encuesta);
                      setVerRespuestasOpen(true);
                    }}
                  >
                    Ver respuestas
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <VerRespuestasModal
        open={verRespuestasOpen}
        onOpenChange={setVerRespuestasOpen}
        encuesta={encuestaSeleccionada}
      />
    </>
  );
}
