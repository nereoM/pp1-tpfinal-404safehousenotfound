export function MonthlyStats({ stats }) {
    return (
      <div className="bg-white rounded-xl shadow p-4 border border-gray-200 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Resumen mensual de actividad</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-blue-700">{stats.postulaciones}</p>
            <p className="text-xs text-gray-600">Postulaciones realizadas</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-purple-700">{stats.entrevistas}</p>
            <p className="text-xs text-gray-600">Entrevistas obtenidas</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-green-700">{stats.coincidenciaPromedio}%</p>
            <p className="text-xs text-gray-600">Coincidencia promedio</p>
          </div>
        </div>
      </div>
    );
  }
  