import { FileX2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { Dialog, DialogContent } from "../components/shadcn/Dialog";

export function LicenciasModal({ service, open, onOpenChange }) {
  const [licencias, setLicencias] = useState([]);
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);
  const [modalSugerenciaAbierto, setModalSugerenciaAbierto] = useState(false);
  const [motivoExpandido, setMotivoExpandido] = useState(null); // ✅ AGREGADO
  const [descripcionExpandida, setDescripcionExpandida] = useState(null); // ✅ AGREGADO

  useEffect(() => {
    service.misLicencias().then(setLicencias);
  }, [service]);

  const handleCancelarLicencia = async (idLicencia) => {
    if (confirm("¿Estás seguro que deseas cancelar esta licencia?")) {
      try {
        await service.cancelarLicencia({ idLicencia });
        const nuevasLicencias = await service.misLicencias();
        setLicencias(nuevasLicencias);
      } catch (error) {
        console.error("Error al cancelar la licencia:", error);
        alert("Ocurrió un error al cancelar la licencia.");
      }
    }
  };

  const handleResponseSugerencia = async (aceptacion) => {
    try {
      service.responderSugerenciaLicencia({
        licenciaId: licenciaSeleccionada.id_licencia,
        aceptacion,
      });
      setLicencias((prevState) =>
        prevState.map((licencia) => {
          if (licencia.id_licencia !== licenciaSeleccionada.id_licencia) {
            return licencia;
          }
          return {
            ...licencia,
            estado_sugerencia: aceptacion
              ? "sugerencia aceptada"
              : "sugerencia rechazada",
            estado: aceptacion ? "sugerencia" : "rechazada",
          };
        })
      );
      setModalSugerenciaAbierto(false);
    } catch (error) {
      console.error("Error al cancelar la licencia:", error);
      alert("Ocurrió un error al cancelar la licencia.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-black">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Mis Licencias
        </h2>

        {licencias.length === 0 ? (
          <div className="flex flex-col gap-4 justify-center items-center text-gray-500">
            <FileX2 />
            <p>
              No tienes licencias registradas.
            </p>
          </div>
        ) : (
          <table className="w-full table-auto border border-gray-300 mb-4 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Tipo</th>
                <th className="p-2 border">Descripción</th>
                <th className="p-2 border">Fecha Inicio</th>
                <th className="p-2 border">Fecha Fin</th>
                <th className="p-2 border">Estado</th>
                <th className="p-2 border">Motivo Rechazo (si aplica)</th>
                <th className="p-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {licencias.map((licencia, idx) => {
                const {
                  tipo,
                  descripcion,
                  estado,
                  motivo_rechazo,
                  id_licencia,
                  fecha_inicio,
                  fecha_fin,
                  estado_sugerencia,
                } = licencia;
                return (
                  <tr key={idx} className="hover:bg-indigo-50">
                    <td className="p-2 border align-top">{tipo}</td>

                    {/* ✅ MODIFICADO: Celda de descripción con truncado y toggle */}
                    <td className="p-2 border text-sm relative text-gray-800 max-w-xs align-top break-words whitespace-pre-wrap">
                      {descripcion && descripcion.trim() !== "" ? (
                        <>
                          {descripcionExpandida === id_licencia ? (
                            <>
                              {descripcion}
                              <button
                                onClick={() => setDescripcionExpandida(null)}
                                className="ml-2 text-blue-600 font-semibold underline text-xs hover:text-white hover:bg-blue-600 px-2 py-0.5 rounded transition-all duration-200"
                              >
                                mostrar menos
                              </button>
                            </>
                          ) : (
                            <>
                              {descripcion.slice(0, 50)}...
                              <button
                                onClick={() =>
                                  setDescripcionExpandida(id_licencia)
                                }
                                className="ml-2 text-blue-600 font-semibold underline text-xs hover:text-white hover:bg-blue-600 px-2 py-0.5 rounded transition-all duration-200"
                              >
                                ver completo
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2 border align-top">
                      {new Date(fecha_inicio).toLocaleDateString()}
                    </td>
                    <td className="p-2 border align-top">
                      {new Date(fecha_fin).toLocaleDateString()}
                    </td>
                    <td className="p-2 border capitalize align-top">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          estado === "activa" || estado === "aprobada"
                            ? "bg-green-100 text-green-800"
                            : estado === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : estado === "sugerencia"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {estado === "aprobada"
                          ? "aprobada"
                          : estado_sugerencia
                          ? estado_sugerencia
                          : estado}
                      </span>
                    </td>
                    <td className="px-4 py-2 border border-gray-300 relative align-top">
                      {estado === "rechazada" ? (
                        <div className="text-sm text-red-500 italic">
                          {motivoExpandido === id_licencia ? (
                            <>
                              {motivo_rechazo ?? "Sin motivo especificado"}
                              <button
                                onClick={() => setMotivoExpandido(null)}
                                className="ml-2 text-blue-600 underline text-xs"
                              >
                                ver menos
                              </button>
                            </>
                          ) : (
                            <>
                              {(
                                motivo_rechazo ?? "Sin motivo especificado"
                              ).substring(0, 30)}
                              ...
                              <button
                                onClick={() => setMotivoExpandido(id_licencia)}
                                className="ml-2 text-blue-600 underline text-xs"
                              >
                                ver completo
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2 border text-center align-top">
                      {licencia.estado_sugerencia === "sugerencia aceptada" ? (
                        "-"
                      ) : estado === "pendiente" || estado === "activa" ? (
                        <button
                          onClick={() => handleCancelarLicencia(id_licencia)}
                          className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Cancelar
                        </button>
                      ) : estado === "sugerencia" ? (
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => {
                              setLicenciaSeleccionada(licencia);
                              setModalSugerenciaAbierto(true);
                            }}
                            className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Ver sugerencia
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {modalSugerenciaAbierto && licenciaSeleccionada && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setModalSugerenciaAbierto(false)}
          >
            <div
              className="bg-white p-6 rounded-2xl w-[90%] max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-center">
                Sugerencia de fechas
              </h3>

              <DayPicker
                className="flex justify-center"
                mode="range"
                selected={{
                  from: new Date(licenciaSeleccionada.fecha_inicio_sugerida),
                  to: new Date(licenciaSeleccionada.fecha_fin_sugerida),
                }}
                disabled={{ before: new Date() }}
                readOnly
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={async () => handleResponseSugerencia(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Aceptar
                </button>
                <button
                  onClick={async () => handleResponseSugerencia(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-right">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
