import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";
import { VerEncuestaModal } from "./VerEncuestaModal";

export function GestionarEncuestasModal({ open, onOpenChange }) {
  const [encuestas, setEncuestas] = useState([]);
  const [modalVerEncuesta, setModalVerEncuesta] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);

  useEffect(() => {
    if (open) {
      fetch("/api/obtener-encuestas-creadas", {
        method: "GET",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al obtener encuestas");
          return res.json();
        })
        .then((data) => {
          // Si alguna encuesta no tiene campo estado, lo seteamos como "Abierta" por default
          const encuestasConEstado = data.map((e) =>
            e.estado ? e : { ...e, estado: "Abierta" }
          );
          setEncuestas(encuestasConEstado);
        })
        .catch((error) => {
          console.error(error);
          setEncuestas([]);
        });
    }
  }, [open]);

  const handleCerrarEncuesta = (id) => {
    setEncuestas((prev) =>
      prev.map((encuesta) =>
        encuesta.id === id ? { ...encuesta, estado: "Cerrada" } : encuesta
      )
    );
  };

  const formatFecha = (iso) => {
    if (!iso) return "Sin fecha";
    const fecha = new Date(iso);
    return fecha.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl space-y-4">
        <DialogTitle className="text-xl font-bold text-black">Gestionar Encuestas</DialogTitle>

        <div className="space-y-4 max-h-[60vh] overflow-auto">
          {encuestas.map((encuesta) => (
            <div
              key={encuesta.id}
              className="border rounded-lg p-4 shadow flex justify-between items-start gap-4 bg-white"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-black">{encuesta.titulo}</h3>
                <p className="text-sm text-gray-700">{encuesta.descripcion}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Publicación: {formatFecha(encuesta.fecha_inicio)} | Cierre: {formatFecha(encuesta.fecha_fin)}
                </p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Tipo: {encuesta.tipo} | Anónima: {encuesta.anonima ? "Sí" : "No"} | Preguntas: {encuesta.preguntas.length}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-md ${
                    encuesta.estado === "Cerrada"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {encuesta.estado === "Cerrada" ? "Cerrada" : "Abierta"}
                </span>

                <div className="flex gap-2 mt-1">
                  <button
                    className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    onClick={() => {
                      setEncuestaSeleccionada(encuesta);
                      setModalVerEncuesta(true);
                    }}
                  >
                    Ver encuesta
                  </button>

                  {encuesta.estado !== "Cerrada" && (
                    <button
                      className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
                      onClick={() => handleCerrarEncuesta(encuesta.id)}
                    >
                      Cerrar encuesta
                    </button>
                  )}
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
            className="px-4 py-2 rounded-md text-white text-sm bg-red-600 hover:bg-red-700"
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
