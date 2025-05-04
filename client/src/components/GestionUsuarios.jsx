import { useEffect, useState } from "react";

export default function GestionUsuarios({ onClose, textColor }) {
  const [empleados, setEmpleados] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/empleados-admin`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setEmpleados(data))
      .catch((err) => console.error("❌ Error al obtener empleados:", err));
  }, []);

  const desvincular = async (id) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/desvincular-manager/${id}`, {
      method: "PUT",
      credentials: "include",
    });
    if (res.ok) {
      setEmpleados(empleados.filter((e) => e.id !== id));
      setConfirmModal({ open: false, id: null });
    } else {
      console.error("❌ Error al desvincular empleado");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: textColor }}>Empleados bajo tu cargo</h2>
        {empleados.length === 0 ? (
          <p className="text-sm" style={{ color: textColor }}>No hay empleados asignados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b" style={{ color: textColor }}>Nombre</th>
                  <th className="px-4 py-2 border-b" style={{ color: textColor }}>Correo</th>
                  <th className="px-4 py-2 border-b" style={{ color: textColor }}>Rol</th>
                  <th className="px-4 py-2 border-b"></th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b" style={{ color: textColor }}>{emp.nombre} {emp.apellido}</td>
                    <td className="px-4 py-2 border-b" style={{ color: textColor }}>{emp.correo}</td>
                    <td className="px-4 py-2 border-b" style={{ color: textColor }}>{emp.roles.join(", ")}</td>
                    <td className="px-4 py-2 border-b text-right">
                      <button
                        onClick={() => setConfirmModal({ open: true, id: emp.id })}
                        className="text-red-600 hover:underline text-sm font-medium"
                      >
                        Desvincular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </div>

      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 shadow-lg w-full max-w-sm space-y-4">
            <h3 className="text-md font-semibold" style={{ color: textColor }}>
              ¿Seguro que querés desvincular a este usuario?
            </h3>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal({ open: false, id: null })}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => desvincular(confirmModal.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
