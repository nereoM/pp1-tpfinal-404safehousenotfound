import { useEstadoPostulaciones } from "../hooks/useEstadoPostulaciones";

export function PostulacionesModal({ onClose }) {
  const { error, loading, postulaciones } = useEstadoPostulaciones();

  if (error) {
    return <section>{error}</section>;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 w-full min-w-[600px] max-w-3xl shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Cargando...</h2>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 w-full min-w-[600px] max-w-3xl shadow-lg space-y-4">
      <h2 className="text-lg font-semibold">Tus postulaciones</h2>

      <ul>
        {postulaciones.map((oferta) => (
          <li key={oferta.id} className="py-2 border-b">
            <div className="flex justify-between">
              <span className="font-medium">{oferta.nombre_oferta}</span>
              <span className="text-sm text-gray-500">{oferta.estado}</span>
            </div>
            <p className="text-sm text-gray-600">
              {oferta.fecha_postulacion}
            </p>
          </li>
        ))}
        {postulaciones.length === 0 && (
          <p className="text-sm text-gray-500">No tenés postulaciones aún.</p>
        )}
      </ul>

      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}