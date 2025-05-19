import { useGestionUsuarios } from "../hooks/useGestionUsuarios";

export default function GestionUsuarios({ onClose, textColor , service}) {
  const { confirmModal, desvincular, empleados, setConfirmModal } = useGestionUsuarios({service})

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: "#000" }}>Empleados bajo tu cargo</h2>
        {empleados.length === 0 ? (
          <p className="text-sm" style={{ color: "#000" }}>No hay empleados asignados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b" style={{ color: "#000" }}>Nombre</th>
                  <th className="px-4 py-2 border-b" style={{ color: "#000" }}>Correo</th>
                  <th className="px-4 py-2 border-b" style={{ color: "#000" }}>Rol</th>
                  <th className="px-4 py-2 border-b"></th>
                </tr>
              </thead>
              <tbody>
                {empleados
                  .filter((emp) => !emp.roles.includes("candidato"))
                  .map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b" style={{ color: "#000" }}>{emp.nombre} {emp.apellido}</td>
                      <td className="px-4 py-2 border-b" style={{ color: "#000" }}>{emp.correo}</td>
                      <td className="px-4 py-2 border-b" style={{ color: "#000" }}>{emp.roles.join(", ")}</td>
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
            <h3 className="text-md font-semibold" style={{ color: "#000" }}>
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
