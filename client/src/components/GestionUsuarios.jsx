import { useGestionUsuarios } from "../hooks/useGestionUsuarios";
import { useState } from "react";

export default function GestionUsuarios({ onClose, textColor , service }) {
  const { confirmModal, desvincular, empleados, setConfirmModal } = useGestionUsuarios({ service });

  // ✅ NUEVO: estado para el mensaje de éxito
  const [mensajeExito, setMensajeExito] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold text-black">Empleados bajo tu cargo</h2>

        {/* ✅ NUEVO: mensaje de éxito */}
        {mensajeExito && (
          <div className="text-sm text-green-800 bg-green-100 p-2 rounded border border-green-300">
            {mensajeExito}
          </div>
        )}

        {empleados.length === 0 ? (
          <p className="text-sm text-blue-700">No hay empleados asignados.</p> 
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full text-sm text-left border border-blue-200"> 
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-6 py-3 border-b border-blue-300 text-blue-900">Nombre</th> 
                  <th className="px-6 py-3 border-b border-blue-300 text-blue-900">Correo</th> 
                  <th className="px-6 py-3 border-b border-blue-300 text-blue-900">Rol</th> 
                  <th className="px-6 py-3 border-b border-blue-300 text-blue-900"></th> 
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100"> 
                {empleados
                  .filter((emp) => !emp.roles.includes("candidato"))
                  .map((emp, index) => (
                    <tr
                      key={emp.id}
                      className={
                        index % 2 === 0
                          ? "bg-white hover:bg-blue-50" 
                          : "bg-blue-50 hover:bg-blue-100" 
                      }
                    >
                      <td className="px-6 py-3 text-blue-800">{emp.nombre} {emp.apellido}</td> 
                      <td className="px-6 py-3 text-blue-800">{emp.correo}</td>
                      <td className="px-6 py-3 text-blue-800">{emp.roles.join(", ")}</td> 
                      <td className="px-6 py-3 text-right">
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
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cerrar
          </button>
        </div>
      </div>

      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 shadow-lg w-full max-w-sm space-y-4">
            <h3 className="text-md font-semibold text-blue-900"> 
              ¿Seguro que querés desvincular a este usuario?
            </h3>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal({ open: false, id: null })}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" 
              >
                Cancelar
              </button>

              {/* ✅ MODIFICADO: botón Confirmar con mensaje */}
              <button
                onClick={async () => {
                  await desvincular(confirmModal.id);
                  setMensajeExito("Empleado desvinculado correctamente.");
                  setConfirmModal({ open: false, id: null });
                  setTimeout(() => setMensajeExito(""), 4000); // limpia el mensaje después de 4s
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
