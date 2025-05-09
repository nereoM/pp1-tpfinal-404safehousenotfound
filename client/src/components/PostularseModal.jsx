import { useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function PostularseModal({cvs, onClose, idOferta}) {
  const [cvSeleccionado, setCvSeleccionado] = useState(cvs[0]);
  const [salarioPretendido, setSalarioPretendido] = useState(0);

  const handlePostularse = () => {
    empleadoService.postularse({idCv: cvSeleccionado , idOferta})
    .then(() => {
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Postularse a la oferta</h2>

        <label className="block text-sm text-gray-600 mb-1">
          Seleccioná un CV
        </label>
        <div className="space-y-2">
          {cvs.slice(0, 3).map((cv) => (
            <div
              key={cv.id}
              onClick={() => setCvSeleccionado(cv.id)}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition w-full ${
                cvSeleccionado === cv.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <div className="w-10 h-12 bg-red-500 text-white font-bold flex items-center justify-center rounded-sm text-sm mr-4 shadow">
                PDF
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium leading-tight">
                  {cv.nombre_archivo || "CV sin nombre"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(cv.fecha_subida).toLocaleDateString()}
                </p>
              </div>
              {cvSeleccionado === cv.id && (
                <div className="text-blue-600 text-lg font-bold">✓</div>
              )}
            </div>
          ))}
          {cvs.length === 0 && (
            <p className="text-sm text-gray-500">No tenés CVs cargados aún.</p>
          )}
        </div>

        <label className="block text-sm text-gray-600 mt-4">
          Salario pretendido (opcional)
        </label>
        <input
          type="number"
          placeholder="Ej: 1200"
          className="w-full p-2 border border-gray-300 rounded"
          value={salarioPretendido}
          onChange={(e) => setSalarioPretendido(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handlePostularse}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
