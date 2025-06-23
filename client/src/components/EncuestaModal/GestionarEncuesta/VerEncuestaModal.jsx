import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";

export function VerEncuestaModal({ open, onClose, encuesta }) {
  const [respuestasInfo, setRespuestasInfo] = useState(null);
  const [respuestasEmpleado, setRespuestasEmpleado] = useState({});
  const [loading, setLoading] = useState(false);
  const [rol, setRol] = useState(null);

  useEffect(() => {
    if (open && encuesta?.id) {
      const r = localStorage.getItem("rol");
      setRol(r);

      const endpoint = `/api/encuesta/${encuesta.id}/respuestas-info` +
        (r === "manager" ? "/manager" : r === "reclutador" ? "/reclutador" : "");

      setLoading(true);
      fetch(endpoint, {
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

  const fetchRespuestasEmpleado = (id_empleado) => {
    const r = rol;
    const endpoint = `/api/encuesta/${encuesta.id}/respuestas-empleado/${id_empleado}` +
      (r === "manager" ? "/manager" : r === "reclutador" ? "/reclutador" : "");

    fetch(endpoint, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setRespuestasEmpleado((prev) => ({ ...prev, [id_empleado]: data })))
      .catch((err) => console.error("Error al obtener detalles del empleado:", err));
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

  if (!encuesta) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl space-y-4">
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
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {respuestasInfo &&
                    [...(respuestasInfo.respondieron || []), ...(respuestasInfo.no_respondieron || [])]
                      .map((usuario, i) => {
                        const respondio = respuestasInfo.respondieron?.some((u) => u.id === usuario.id);
                        const respuestas = respuestasEmpleado[usuario.id];

                        return (
                          <tr key={i} className="border-t align-top">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="text-black">{usuario.nombre} {usuario.apellido}</span>
                            </td>
                            <td className="px-3 py-2">
                              {respondio ? (
                                <span className="text-green-600 font-medium">Respondió</span>
                              ) : (
                                <span className="text-red-600 font-medium">No respondió</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {respondio && (
                                <button
                                  onClick={() => fetchRespuestasEmpleado(usuario.id)}
                                  className="text-blue-600 underline text-sm"
                                >
                                  Ver respuestas
                                </button>
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

        {Object.values(respuestasEmpleado).map((detalle, i) => (
          <div key={i} className="mt-6 border-t pt-4">
            <h5 className="font-semibold text-black">Respuestas de: {detalle.empleado.nombre} {detalle.empleado.apellido}</h5>
            <ul className="mt-2 text-sm text-gray-700 space-y-2">
              {detalle.respuestas.map((r, idx) => (
                <li key={idx} className="border rounded p-2 bg-gray-50">
                  <b>{r.pregunta}</b>: {r.respuesta}
                </li>
              ))}
            </ul>
          </div>
        ))}

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
