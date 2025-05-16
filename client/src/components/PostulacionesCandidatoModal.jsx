import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;

export default function PostulacionesCandidatoModal({ isOpen, onClose }) {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPostulaciones = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/api/estado-postulaciones-candidato`, {
          method: 'GET',
          credentials: 'include'
        });

        if (res.status === 403) {
          throw new Error('No estás autorizado para ver tus postulaciones');
        }
        if (res.status === 404) {
          setPostulaciones([]);
        } else {
          const data = await res.json();
          setPostulaciones(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostulaciones();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-black">Mis postulaciones</h2>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <p className="text-gray-600">Cargando postulaciones...</p>
          </div>
        )}

        {error && (
          <div className="text-red-600 bg-red-100 p-2 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          postulaciones.length > 0 ? (
            <ul className="space-y-4 max-h-64 overflow-y-auto">
              {postulaciones.map(p => (
                <li key={p.id_postulacion} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black">{p.nombre_oferta}</span>
                    <span className="text-sm text-gray-500">{p.estado}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(p.fecha_postulacion).toLocaleDateString('es-AR')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center text-gray-600">
              No tienes postulaciones aún.
            </div>
          )
        )}

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
