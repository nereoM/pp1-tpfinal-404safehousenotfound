export function JobCard({ titulo, empresa, coincidencia, palabrasClave, fecha, postulaciones, onPostularse }) {
  return (
    <div className="bg-white p-4 rounded shadow space-y-3 border border-gray-100">
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold text-gray-800">{titulo}</div>
        <div className="text-xs text-gray-500">{fecha}</div>
      </div>
      <div className="text-sm text-gray-600">{empresa}</div>
      <div className="text-sm text-gray-700">🎯 Coincidencia: {coincidencia}%</div>

      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {palabrasClave.map((palabra, idx) => (
          <span key={idx} className="bg-gray-100 px-2 py-1 rounded-full">
            {palabra}
          </span>
        ))}
      </div>

      <div className="text-xs text-gray-500">👥 {postulaciones} personas postuladas</div>

      <button
        onClick={onPostularse}
        className="mt-3 bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
      >
        Postularse
      </button>
    </div>
  );
}
