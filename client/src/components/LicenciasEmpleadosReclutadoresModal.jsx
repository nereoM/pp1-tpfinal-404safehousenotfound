import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { useLicenciasACargo } from "../services/useLicenciasACargo";

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

export function LicenciasEmpleadosReclutadoresModal({ onClose }) {
  const {
    error,
    licencias,
    loading,
    evaluarLicencia,
    mensajeEvaluacion,
    setError,
    licenciaSeleccionada, setLicenciaSeleccionada
  } = useLicenciasACargo();

  const [modalRechazoOpen, setModalRechazoOpen] = useState(false);
  const [modalNegociacionFecha, setModalNegociacionFecha] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  // const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);

  const abrirModalRechazo = (licencia) => {
    setLicenciaSeleccionada(licencia);
    setModalRechazoOpen(true);
  };

  const handleUpdateFecha = (newDate) => {
    if(!newDate){
      return
    }

    setLicenciaSeleccionada((prevState) => ({
      ...prevState,
      fecha_fin: newDate.to,
      fecha_inicio: newDate.from,
    }));
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white p-6 rounded-2xl w-4/5 max-h-[80vh] overflow-auto text-black">
          <div className="mb-4 text-center text-red-600 font-semibold">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white p-6 rounded-2xl w-4/5 max-h-[80vh] overflow-auto text-black">
          <div className="mb-4 text-center font-semibold">
            Cargando licencias...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-2xl w-4/5 max-h-[80vh] overflow-auto text-black">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Mis Licencias
        </h2>

        {mensajeEvaluacion && (
          <div className="mb-4 text-center text-indigo-700 font-semibold bg-indigo-100 p-2 rounded">
            {mensajeEvaluacion}
          </div>
        )}

        {licencias.length === 0 ? (
          <p className="text-center text-gray-500">
            No hay licencias solicitadas.
          </p>
        ) : (
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left border-b">Empleado</th>
                <th className="px-4 py-2 text-left border-b">Tipo</th>
                <th className="px-4 py-2 text-left border-b">Descripción</th>
                <th className="px-4 py-2 text-left border-b">
                  Fecha de Inicio
                </th>
                <th className="px-4 py-2 text-left border-b">Fecha de Fin</th>
                <th className="px-4 py-2 text-left border-b">Estado</th>
                <th className="px-4 py-2 text-left border-b">Motivo Rechazo</th>
                <th className="px-4 py-2 text-left border-b">Certificado</th>
                <th className="px-4 py-2 text-left border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {licencias.map((item, index) => {
                const licencia = item.licencia;
                const empleado = licencia.empleado;
                return (
                  <tr key={index}>
                    <td>
                      {empleado.nombre} {empleado.apellido}
                    </td>
                    <td>{licencia.tipo}</td>
                    <td>{licencia.descripcion}</td>
                    <td>
                      {licencia.fecha_inicio
                        ? new Date(licencia.fecha_inicio).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {licencia.fecha_fin
                        ? new Date(licencia.fecha_fin).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2 capitalize">{licencia.estado}</td>
                    <td className="px-4 py-2">
                      {licencia.motivo_rechazo || "-"}
                    </td>
                    <td className="px-4 py-2">
                      {licencia.certificado_url ? (
                        <a
                          href={`${import.meta.env.VITE_API_URL}/${
                            licencia.certificado_url
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 underline"
                        >
                          Ver certificado
                        </a>
                      ) : (
                        "Sin certificado"
                      )}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      {licencia.estado === "pendiente" ? (
                        <>
                          <button
                            onClick={() =>
                              evaluarLicencia(licencia.id_licencia, "aprobada")
                            }
                            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => abrirModalRechazo(licencia)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Rechazar
                          </button>
                        </>
                      ) : licencia.estado === "aprobada" &&
                        licencia.certificado_url ? (
                        <section className="flex flex-col gap-1">
                          <button
                            onClick={() =>
                              evaluarLicencia(licencia.id_licencia, "activa")
                            }
                            className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                          >
                            Validar
                          </button>
                          <button
                            onClick={() => {
                              setLicenciaSeleccionada(licencia);
                              setModalNegociacionFecha(true);
                            }}
                            className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                          >
                            Modificar fechas
                          </button>
                        </section>
                      ) : (
                        <span className="text-gray-500 italic">
                          Licencia ya evaluada ({licencia.estado})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {modalRechazoOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow space-y-4">
              <h2 className="text-lg font-semibold">
                Indique el motivo del rechazo
              </h2>
              <textarea
                className="w-full p-2 border border-gray-300 rounded resize-none"
                rows="4"
                placeholder="Escriba el motivo del rechazo..."
                value={motivoRechazo}
                onChange={(e) => {
                  setMotivoRechazo(e.target.value);
                  setError("");
                }}
              ></textarea>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalRechazoOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (motivoRechazo.trim()) {
                      evaluarLicencia(
                        licenciaSeleccionada.id_licencia,
                        "rechazada"
                      );
                      setModalRechazoOpen(false);
                    } else {
                      setError(
                        "Debe indicar un motivo para rechazar la licencia."
                      );
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalNegociacionFecha && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow space-y-4">
              <h2 className="text-lg font-semibold">
                Indique las fechas de validez de la licencia
              </h2>
              <section>
                <label className="text-sm font-medium text-gray-700">
                  Rango de fechas
                </label>
                <DayPicker
                  className="flex justify-center"
                  mode="range"
                  onSelect={handleUpdateFecha}
                  disabled={{ before: hoy }}
                  selected={{
                    from: licenciaSeleccionada.fecha_inicio,
                    to: licenciaSeleccionada.fecha_fin,
                  }}
                />
              </section>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalNegociacionFecha(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    evaluarLicencia().then(() => {
                      setModalNegociacionFecha(false)
                    })
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
