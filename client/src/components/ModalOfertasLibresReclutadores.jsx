import React, { useEffect, useState } from 'react';

const ModalOfertasLibresReclutadores = ({ isOpen, onClose, analistas }) => {
  const [ofertasLibres, setOfertasLibres] = useState([]);
  const [selectedAnalista, setSelectedAnalista] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  const fetchOfertasLibres = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ofertas-libres-reclutadores`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setOfertasLibres(data.ofertas_libres_reclutadores);
      } else {
        setMensaje(data.message);
      }
    } catch (error) {
      console.error("Error al obtener las ofertas libres:", error);
      setMensaje("Error al obtener ofertas.");
    }
  };

  const fetchOfertaInfo = async (id_oferta) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/oferta-libre-${id_oferta}/informacion`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setOfertaSeleccionada(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error al obtener la información de la oferta:", error);
    }
  };

  const reasignarOferta = async (id_oferta) => {
    if (!selectedAnalista) {
      alert("Seleccioná un analista para reasignar.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/oferta-libre-${id_oferta}/reasignacion`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_nuevo_reclutador: selectedAnalista }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Oferta reasignada exitosamente a ${data.nuevo_reclutador.username}`);
        fetchOfertasLibres();
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error al reasignar la oferta:", error);
    }
  };

  useEffect(() => {
    if (isOpen) fetchOfertasLibres();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-3/4 max-h-[80vh] overflow-auto text-black">
        <h2 className="text-2xl font-semibold mb-4">Ofertas Libres de Reclutadores</h2>

        {mensaje && <p className="text-red-600">{mensaje}</p>}

        {ofertaSeleccionada && (
          <div className="p-4 mb-4 border rounded-lg">
            <h3 className="text-xl font-semibold">{ofertaSeleccionada.nombre}</h3>
            <p>{ofertaSeleccionada.descripcion}</p>
            <p><strong>Ubicación:</strong> {ofertaSeleccionada.location}</p>
            <p><strong>Tipo de empleo:</strong> {ofertaSeleccionada.employment_type}</p>
            <p><strong>Modalidad:</strong> {ofertaSeleccionada.workplace_type}</p>
            <p><strong>Salario:</strong> {ofertaSeleccionada.salary_min} - {ofertaSeleccionada.salary_max} {ofertaSeleccionada.currency}</p>
          </div>
        )}

        <table className="min-w-full table-auto border-collapse text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Descripción</th>
              <th className="px-4 py-2 text-left">Reasignar</th>
              <th className="px-4 py-2 text-left">Ver Detalle</th>
            </tr>
          </thead>
          <tbody>
            {ofertasLibres.map((oferta) => (
              <tr key={oferta.id_oferta} className="border-t">
                <td className="px-4 py-2">{oferta.nombre}</td>
                <td className="px-4 py-2">{oferta.descripcion}</td>
                <td className="px-4 py-2">
                  <select
                    value={selectedAnalista}
                    onChange={(e) => setSelectedAnalista(e.target.value)}
                    className="border px-2 py-1 rounded mr-2"
                  >
                    <option value="">Seleccione Analista</option>
                    {analistas.map((analista) => (
                      <option key={analista.id} value={analista.id}>
                        {analista.username}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => reasignarOferta(oferta.id_oferta)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Reasignar
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => fetchOfertaInfo(oferta.id_oferta)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalOfertasLibresReclutadores;
