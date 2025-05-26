import { useEffect, useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function LicenciasModal({ onClose }) {
  const [licencias, setLicencias] = useState([]);
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);
  const [modalSugerenciaAbierto, setModalSugerenciaAbierto] = useState(false);

  useEffect(() => {
    empleadoService.misLicencias().then(setLicencias);
  }, []);

  const handleCancelarLicencia = async (idLicencia) => {
    if (confirm("¿Estás seguro que deseas cancelar esta licencia?")) {
      try {
        await empleadoService.cancelarLicencia({ idLicencia });
        const nuevasLicencias = await empleadoService.misLicencias();
        setLicencias(nuevasLicencias);
      } catch (error) {
        console.error("Error al cancelar la licencia:", error);
        alert("Ocurrió un error al cancelar la licencia.");
      }
    }
  };

  const handleResponseSugerencia = async (aceptacion) => {
    try {
      empleadoService.responderSugerenciaLicencia({
        licenciaId: licenciaSeleccionada.id_licencia,
        aceptacion
      })
      const nuevasLicencias = await empleadoService.misLicencias();
        setLicencias(nuevasLicencias);
    } catch (error) {
      console.error("Error al cancelar la licencia:", error);
        alert("Ocurrió un error al cancelar la licencia.");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl w-3/4 max-h-[70vh] overflow-auto text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Mis Licencias
        </h2>

        {licencias.length === 0 ? (
          <p className="text-center text-gray-500">
            No tienes licencias registradas.
          </p>
        ) : (
          <table className="w-full table-auto border border-gray-300 mb-4 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Tipo</th>
                <th className="p-2 border">Descripción</th>
                <th className="p-2 border">Estado</th>
                <th className="p-2 border">Motivo Rechazo (si aplica)</th>
                <th className="p-2 border">Acciones</th> {/* <-- NEW COLUMN */}
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
                } = licencia;
                return (
                  <tr key={idx} className="hover:bg-indigo-50">
                    <td className="p-2 border">{tipo}</td>
                    <td className="p-2 border">
                      {descripcion && descripcion.trim() !== ""
                        ? descripcion
                        : "-"}
                    </td>
                    <td className="p-2 border capitalize">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          estado === "activa"
                            ? "bg-green-100 text-green-800"
                            : estado === "aprobada" || estado === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {estado}
                      </span>
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {estado === "rechazada" ? (
                        <span className="text-sm text-red-500 italic">
                          {motivo_rechazo ?? "Sin motivo especificado"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2 border text-center">
                      {estado === "pendiente" || estado === "activa" ? (
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
                  from: new Date(licenciaSeleccionada.fecha_sugerida_inicio),
                  to: new Date(licenciaSeleccionada.fecha_sugerida_fin),
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
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
