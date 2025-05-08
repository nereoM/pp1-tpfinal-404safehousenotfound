import { useEffect, useState } from "react";
import { empleadoService } from "../services/empleadoService";
import { SubirCertificadoModal } from "./SubirCertificado";

export function LicenciasModal({ onClose }) {
  const [licencias, setLicencias] = useState([]);
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);

  useEffect(() => {
    empleadoService.misLicencias().then(setLicencias);
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
          <h2 className="text-lg font-semibold">Tus licencias</h2>

          <ul className="flex flex-col gap-2">
            {licencias.map((licencia) => (
              <li
                className="p-2 bg-gray-400 cursor-pointer"
                onClick={() => setLicenciaSeleccionada(licencia.id_licencia)}
                key={licencia.id_licencia}
              >
                <p>{licencia.descripcion}</p>
              </li>
            ))}
          </ul>

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
