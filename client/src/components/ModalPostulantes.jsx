import React from 'react';

export default function ModalPostulantes({
  isOpen,
  onClose,
  filtros,
  setFiltros,
  toggleFiltros,
  mostrarFiltros,
  setMostrarFiltros,
  filtrarPostulantes,
  postulantesFiltrados,
  estadoPostulaciones,
  evaluarPostulacion
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-black">Postulantes</h2>

        {/* mostrar/ocultar filtros */}
      <div className="flex gap-6">
        {/* Panel lateral de filtros */}
        <div className="w-1/4 min-w-[220px]">
          <button
            onClick={toggleFiltros}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-between mb-4"
          >
            {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
            <span>{mostrarFiltros ? '▲' : '▼'}</span>
          </button>

          {mostrarFiltros && (
            <div className="p-4 border rounded-lg bg-gray-800">
              <input
                type="text"
                placeholder="Nombre"
                value={filtros.nombre}
                onChange={e => {
                  setFiltros(prev => ({ ...prev, nombre: e.target.value }));
                  filtrarPostulantes(e.target.value, filtros.email, filtros.is_apto, filtros.fecha_desde, filtros.fecha_hasta);
                }}
                className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Email"
                value={filtros.email}
                onChange={e => {
                  setFiltros(prev => ({ ...prev, email: e.target.value }));
                  filtrarPostulantes(filtros.nombre, e.target.value, filtros.is_apto, filtros.fecha_desde, filtros.fecha_hasta);
                }}
                className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full placeholder-gray-400"
              />
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={e => {
                  setFiltros(prev => ({ ...prev, fecha_desde: e.target.value }));
                  filtrarPostulantes(filtros.nombre, filtros.email, filtros.is_apto, e.target.value, filtros.fecha_hasta);
                }}
                className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full"
              />
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={e => {
                  setFiltros(prev => ({ ...prev, fecha_hasta: e.target.value }));
                  filtrarPostulantes(filtros.nombre, filtros.email, filtros.is_apto, filtros.fecha_desde, e.target.value);
                }}
                className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full"
              />
              <select
                value={filtros.is_apto}
                onChange={e => {
                  setFiltros(prev => ({ ...prev, is_apto: e.target.value }));
                  filtrarPostulantes(filtros.nombre, filtros.email, e.target.value, filtros.fecha_desde, filtros.fecha_hasta);
                }}
                className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full"
              >
                <option value="">Todos</option>
                <option value="true">Apto</option>
                <option value="false">No Apto</option>
              </select>
            </div>
          )}
        </div>

        {/* Tarjetas de postulantes */}
        <div className="flex-1">
          {postulantesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-gray-500 text-lg">No hay postulantes.</p>
              <p className="text-gray-400 text-sm">aún no se ha registrado ninguno para esta oferta.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              {postulantesFiltrados.map((c, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-black truncate mb-1">{c.nombre}</span>
                    <span className="text-sm text-gray-700 truncate mb-1">{c.email}</span>
                    <span className="text-xs text-gray-500 mb-2">
                      {new Date(c.fecha_postulacion).toLocaleDateString()}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${c.is_apto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}> 
                      {c.is_apto ? 'apto' : 'no apto'}
                    </span>
                    {c.cv_url && (
                      <a
                        href={`${import.meta.env.VITE_API_URL}/${c.cv_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-indigo-600 hover:underline text-sm"
                      >ver cv</a>
                    )}
                    <span className="text-sm text-gray-600 mb-2">
                      Similitud: {c.porcentaje_similitud}%
                    </span>
                    {(estadoPostulaciones[c.id_postulacion] ?? c.estado_postulacion) !== 'pendiente' && (
                      <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${
                        (estadoPostulaciones[c.id_postulacion] ?? c.estado_postulacion) === 'aprobada'
                          ? 'bg-green-200 text-green-800 border border-green-400'
                          : 'bg-red-200 text-red-800 border border-red-400'
                      }`}> 
                        {(estadoPostulaciones[c.id_postulacion] ?? c.estado_postulacion) === 'aprobada'
                          ? 'postulación aprobada'
                          : 'postulación rechazada'}
                      </span>
                    )}
                  </div>
                  {(estadoPostulaciones[c.id_postulacion] ?? c.estado_postulacion) === 'pendiente' && (
                    <div className="flex justify-between items-center pt-3 mt-auto">
                      <button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1.5 rounded-md mr-2 shadow"
                        onClick={() => evaluarPostulacion(c.id_postulacion, 'aprobada')}
                      >
                        aprobar
                      </button>
                      <button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-1.5 rounded-md ml-2 shadow"
                        onClick={() => evaluarPostulacion(c.id_postulacion, 'rechazada')}
                      >
                        rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


        <div className="mt-6 text-right">
          <button
            onClick={() => {
              // Resetear filtros
              setFiltros({
                nombre: '',
                email: '',
                is_apto: '',
                fecha_desde: '',
                fecha_hasta: ''
              });
              setMostrarFiltros(false); // 👈 OCULTA FILTROS
              // Cerrar modal
              onClose();
            }}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
