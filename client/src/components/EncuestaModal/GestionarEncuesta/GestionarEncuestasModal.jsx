import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";
import { VerEncuestaModal } from "./VerEncuestaModal";
import { Download } from "lucide-react";

export function GestionarEncuestasModal({ open, onOpenChange }) {
  const [encuestas, setEncuestas] = useState([]);
  const [modalVerEncuesta, setModalVerEncuesta] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
  const [rol, setRol] = useState(null);

  useEffect(() => {
    if (!open) return;
    const r = localStorage.getItem("rol");
    setRol(r);

    const endpoint =
      r === "manager"
        ? "/api/obtener-encuestas-creadas/manager"
        : r === "reclutador"
        ? "/api/obtener-encuestas-creadas/reclutador"
        : r === "empleado"
        ? "/api/obtener-encuestas-creadas"
        : "/api/obtener-encuestas-creadas";

    fetch(endpoint, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener encuestas");
        return res.json();
      })
      .then((data) => {
        const encuestasConEstado = data.map((e) => ({
          // unificamos id
          id: e.id_encuesta ?? e.id,
          titulo: e.titulo,
          descripcion: e.descripcion,
          tipo: e.tipo,
          anonima: e.anonima ?? e.es_anonima,
          fecha_inicio: e.fecha_inicio,
          fecha_fin: e.fecha_fin,
          // capitalizamos el estado que venga del backend
          estado: e.estado
            ? e.estado.charAt(0).toUpperCase() + e.estado.slice(1).toLowerCase()
            : "Abierta",
          preguntas: e.preguntas ?? [],
        }));
        setEncuestas(encuestasConEstado);
      })
      .catch((error) => {
        console.error(error);
        setEncuestas([]);
      });
  }, [open]);

  const handleCerrarEncuesta = async (id) => {
    const apiUrl = import.meta.env.VITE_API_URL || "";

    const url =
      rol === "manager"
        ? `${apiUrl}/api/cerrar-encuesta/${id}/manager`
        : rol === "reclutador"
        ? `${apiUrl}/api/cerrar-encuesta/${id}/reclutador`
        : rol === "empleado"
        ? `${apiUrl}/api/cerrar-encuesta/${id}/jefe-area`
        : null;

    if (!url) return;

    try {
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo cerrar la encuesta");
      }
      setEncuestas((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, estado: "Cerrada" } : e
        )
      );
    } catch (error) {
      console.error("Error al cerrar la encuesta:", error);
      // aquí podrías mostrar un toast de error
    }
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

  const descargarReporteEncuestas = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/reporte-encuestas-empresa`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("No se pudo descargar el reporte");
      const blob = await res.blob();
      const link = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = link;
      a.download = "reporte_encuestas.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(link);
    } catch (err) {
      alert("Error al descargar el reporte: " + err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl space-y-4">
        <DialogTitle className="text-xl font-bold text-black">
          Gestionar Encuestas
        </DialogTitle>

        {rol === "manager" && (
          <div className="flex justify-end mb-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-900 transition font-semibold shadow"
              onClick={descargarReporteEncuestas}
            >
              <Download className="w-5 h-5" />
              Descargar Reporte PDF
            </button>
          </div>
        )}

        <div className="space-y-4 max-h-[60vh] overflow-auto">
          {encuestas.length > 0 ? (
            encuestas.map((encuesta) => (
              <div
                key={encuesta.id}
                className="border rounded-lg p-4 shadow flex justify-between items-start gap-4 bg-white"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black">
                    {encuesta.titulo}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {encuesta.descripcion}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Publicación: {formatFecha(encuesta.fecha_inicio)} | Cierre:{" "}
                    {formatFecha(encuesta.fecha_fin)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Tipo: {encuesta.tipo} | Anónima:{" "}
                    {encuesta.anonima ? "Sí" : "No"} | Preguntas:{" "}
                    {encuesta.preguntas.length}
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
                    {encuesta.estado}
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
                    {(rol === "manager" ||
                      rol === "reclutador" ||
                      rol === "empleado") &&
                      encuesta.estado !== "Cerrada" && (
                        <button
                          className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
                          onClick={() =>
                            handleCerrarEncuesta(encuesta.id)
                          }
                        >
                          Cerrar encuesta
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))
          ) : (
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
        esManager={rol === "manager"}
      />
    </Dialog>
  );
}
