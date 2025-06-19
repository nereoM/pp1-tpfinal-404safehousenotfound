import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";

export function VerEncuestaModal({ open, onClose, encuesta }) {
  const [respuestasInfo, setRespuestasInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && encuesta?.id) {
      setLoading(true);
      fetch(`/api/empleado/encuesta/${encuesta.id}/respuestas-info`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setRespuestasInfo(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error al obtener respuestas:", err);
          setRespuestasInfo(null);
          setLoading(false);
        });
    }
  }, [open, encuesta]);

  if (!encuesta) return null;

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl space-y-4">
        <DialogTitle className="text-xl font-bold text-black">{encuesta.titulo}</DialogTitle>

        <div className="space-y-1 text-sm text-gray-700">
          <p><b>Descripción:</b> {encuesta.descripcion}</p>
          <p><b>Fecha de publicación:</b> {formatFecha(encuesta.fecha_inicio)}</p>
          <p><b>Fecha de cierre:</b> {formatFecha(encuesta.fecha_fin)}</p>
          {respuestasInfo && (
            <p>
              <b>Respuestas:</b> {respuestasInfo.total_respondieron} / {respuestasInfo.total_asignados}
            </p>
          )}
        </div>

        <div className="mt-4">
          <h4 className="text-md font-semibold text-black mb-2">Estado de respuesta por empleado</h4>

          {loading ? (
            <div className="text-sm text-gray-500 text-center py-4">Cargando respuestas...</div>
          ) : (
            <div className="border rounded overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-3 py-2">Empleado</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {respuestasInfo &&
                    [...(respuestasInfo.respondieron || []), ...(respuestasInfo.no_respondieron || [])]
                      .map((usuario, i) => {
                        const respondio = respuestasInfo.respondieron?.some((u) => u.id === usuario.id);
                        return (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">
                              {usuario.nombre} {usuario.apellido}
                            </td>
                            <td className="px-3 py-2">
                              {respondio ? (
                                <span className="text-green-600 font-medium">Respondió</span>
                              ) : (
                                <span className="text-red-600 font-medium">No respondió</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
