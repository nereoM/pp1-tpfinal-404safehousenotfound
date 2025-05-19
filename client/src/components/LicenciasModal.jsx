import { useEffect, useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function LicenciasModal({ onClose }) {
  const [licencias, setLicencias] = useState([]);

  useEffect(() => {
    empleadoService.misLicencias().then(setLicencias);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl w-3/4 max-h-[70vh] overflow-auto text-black"
        onClick={e => e.stopPropagation()}
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
              </tr>
            </thead>
            <tbody>
              {licencias.map((licencia, idx) => {
                const { tipo, descripcion, estado, motivo_rechazo } = licencia;
                return (
                  <tr key={idx} className="hover:bg-indigo-50">
                    <td className="p-2 border">{tipo}</td>
                    <td className="p-2 border">{descripcion && descripcion.trim() !== "" ? descripcion : "-"}</td>
                    <td className="p-2 border capitalize">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${estado === "activa"
                          ? "bg-green-100 text-green-800"
                          : estado === "aprobada"
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
                  </tr>
                );
              })}
            </tbody>
          </table>
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