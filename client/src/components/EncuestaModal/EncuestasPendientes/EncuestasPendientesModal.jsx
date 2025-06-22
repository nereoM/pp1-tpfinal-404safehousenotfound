import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";
import ResponderEncuestaModal from "./ResponderEncuestaModal";

export function EncuestasPendientesModal({ open, onOpenChange }) {
  const [encuestas, setEncuestas] = useState([]);
  const [modalResponder, setModalResponder] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);

  useEffect(() => {
    if (open) {
      fetch("/api/obtener-encuestas-asignadas", {
        method: "GET",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al obtener encuestas asignadas");
          return res.json();
        })
        .then((lista) => {
          setEncuestas(lista);
        })
        .catch((err) => {
          console.error("Error al cargar encuestas asignadas", err);
          setEncuestas([]);
        });
    }
  }, [open]);

  const quitarEncuestaRespondida = (idRespondida) => {
    setEncuestas((prev) => prev.filter((e) => e.id_encuesta !== idRespondida));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl space-y-4" aria-describedby="desc">
        <p id="desc" className="sr-only">Lista de encuestas pendientes asignadas al empleado.</p>
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
                key={encuesta.id_encuesta}
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
