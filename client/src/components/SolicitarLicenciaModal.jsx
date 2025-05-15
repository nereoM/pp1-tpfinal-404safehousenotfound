import { useSolicitarLicencia } from "../hooks/useSolicitarLicencia";

export function SolicitarLicenciaModal({ onClose, serviceFn }) {
  const {
    solicitarLicencia,
    topMessage,
    updateDescription,
    updateTipoLicencia,
    formState,
  } = useSolicitarLicencia({
    serviceFn,
    onSuccess() {
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    solicitarLicencia();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4 text-black">
        <h2 className="text-xl font-semibold">Solicitud de Licencia</h2>

        {topMessage && (
          <div className="text-sm text-gray-100 bg-indigo-600 p-2 rounded">
            {topMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium">Tipo de licencia</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="vacaciones, enfermedad, etc."
                value={formState.tipoLicencia}
                onChange={(e) => updateTipoLicencia(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Descripción (Opcional)
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Motivo o detalles adicionales"
                value={formState.descripcion}
                onChange={(e) => updateDescription(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
