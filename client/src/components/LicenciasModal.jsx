import { useEffect, useState } from "react";
import { empleadoService } from "../services/empleadoService";
import { SubirCertificadoModal } from "./SubirCertificado";

export function LicenciasModal({ onClose }) {
  const [licencias, setLicencias] = useState([]);
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState("");

  useEffect(() => {
    empleadoService.misLicencias().then(setLicencias);
  }, []);

  const handleLicenciaSeleccionada = (licencia) => {
    if (licencia.estado === "aprobada") {
      setLicenciaSeleccionada(licencia.id_licencia);
      setMensajeAdvertencia(""); // Limpiamos el mensaje si la licencia está aprobada
    } else {
      setLicenciaSeleccionada(null);
      setMensajeAdvertencia("Solo puedes subir un certificado si la licencia está aprobada.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg space-y-4">
          <h2 className="text-lg font-semibold">Tus Licencias</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-left">Descripción</th>
                  <th className="px-4 py-2 border border-gray-300 text-left">Tipo</th>
                  <th className="px-4 py-2 border border-gray-300 text-left">Estado</th>
                  <th className="px-4 py-2 border border-gray-300 text-left">Motivo (si aplica)</th>
                </tr>
              </thead>
              <tbody>
                {licencias.map((licencia) => (
                  <tr
                    key={licencia.id_licencia}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleLicenciaSeleccionada(licencia)}
                  >
                    <td className="px-4 py-2 border border-gray-300">{licencia.descripcion}</td>
                    <td className="px-4 py-2 border border-gray-300">{licencia.tipo}</td>
                    <td
                      className={`px-4 py-2 border border-gray-300 font-semibold ${licencia.estado === "rechazada"
                          ? "text-red-500"
                          : licencia.estado === "aprobada"
                            ? "text-green-500"
                            : "text-gray-500"
                        }`}
                    >
                      {licencia.estado}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {licencia.estado === "rechazada" ? (
                        <span className="text-sm text-red-500 italic">
                          {licencia.motivo_rechazo || "Sin motivo especificado"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mensajeAdvertencia && (
            <div className="text-red-500 text-sm mt-4">
              {mensajeAdvertencia}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {licenciaSeleccionada && (
        <SubirCertificadoModal
          onClose={() => setLicenciaSeleccionada(null)}
          idLicencia={licenciaSeleccionada}
        />
      )}
    </>
  );
}
