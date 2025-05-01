export function JobCard({ titulo, empresa, coincidencia, palabrasClave, onPostularse }) {
    return (
      <div className="bg-white p-4 rounded shadow space-y-2">
        <div className="text-xl font-semibold">{titulo}</div>
        <div className="text-sm text-gray-500">{empresa}</div>
        <div className="text-sm">Coincidencia: {coincidencia}%</div>
        <div className="text-xs text-gray-400">
          Palabras clave: {palabrasClave.join(', ')}
        </div>
        <button
          onClick={onPostularse}
          className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Postularse
        </button>
      </div>
    );
  }