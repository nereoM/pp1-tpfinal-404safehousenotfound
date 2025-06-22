import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";
import { VerRespuestasModal } from "./VerRespuestasModal";

export function EncuestasRespondidasModal({ open, onOpenChange }) {
  const [encuestas, setEncuestas] = useState([]);
  const [verRespuestasOpen, setVerRespuestasOpen] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("http://localhost:5000/api/mis-encuestas-respondidas", {
        method: "GET",
        credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setEncuestas(data);
          } else {
            setEncuestas([]);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Error al cargar encuestas respondidas:", err);
          setEncuestas([]);
          setLoading(false);
        });
    }
  }, [open]);

  const handleVerRespuestas = async (encuesta) => {
    try {
      const res = await fetch(`http://localhost:5000/api/mis-respuestas-encuesta/${encuesta.id_encuesta}`, {
        credentials: "include",
      });
      const data = await res.json();

      // Guardamos la encuesta junto con sus respuestas
      setEncuestaSeleccionada({
        ...encuesta,
        respuestas: data.respuestas
      });
      setVerRespuestasOpen(true);
    } catch (error) {
      console.error("Error al cargar respuestas:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl space-y-4">
          <DialogTitle className="text-center text-2xl font-bold">
            Encuestas Respondidas
          </DialogTitle>

          {loading ? (
            <p className="text-center text-gray-500">Cargando...</p>
          ) : encuestas.length === 0 ? (
            <p className="text-center text-gray-500">No hay encuestas respondidas aún.</p>
          ) : (
            <div className="space-y-4 max-h-[65vh] overflow-auto">
              {encuestas.map((encuesta) => (
                <div
                  key={encuesta.id_encuesta}
                  className="rounded-lg border bg-white p-4 shadow flex justify-between items-start"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-black">{encuesta.titulo}</h3>
                    <p className="text-sm text-gray-700">{encuesta.descripcion}</p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleVerRespuestas(encuesta)}
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
