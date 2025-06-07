import { FileX2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "../components/shadcn/Dialog";
import { empleadoService } from "../services/empleadoService";

export function GestionarDesempeñoEmpleadosModal({ open, onOpenChange }) {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [modalDesempeñoOpen, setModalDesempeñoOpen] = useState(false);
  const [rendimiento, setRendimiento] = useState("");

  useEffect(() => {
    if (open) {
      empleadoService.obtenerEmpleadosMiArea().then((res) => setEmpleados(res.empleados_area));
    }
  }, [open]);

  const handleAsignarDesempeño = async () => {
    try {
      await empleadoService.establecerRendimientoEmpleado({
        id_empleado: empleadoSeleccionado.id,
        rendimiento: parseFloat(rendimiento),
      });
      setEmpleadoSeleccionado(null);
      setRendimiento("");
      setModalDesempeñoOpen(false);
    } catch (error) {
      console.error("Error al asignar desempeño al empleado:", error);
      alert("Ocurrió un error al asignar el desempeño.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-black w-[95vw] max-w-[1000px]">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Empleados a cargo
        </h2>

        {empleados.length === 0 ? (
          <div className="flex flex-col gap-4 justify-center items-center text-gray-500">
            <FileX2 />
            <p>No hay empleados a tu cargo.</p>
          </div>
        ) : (
          <table className="w-full table-auto border border-gray-300 mb-4 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Nombre</th>
                <th className="p-2 border">Apellido</th>
                <th className="p-2 border">Correo</th>
                <th className="p-2 border">Username</th>
                <th className="p-2 border">Puesto</th>
                <th className="p-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados?.map((emp) => (
                <tr key={emp.id} className="hover:bg-indigo-50">
                  <td className="p-2 border">{emp.nombre}</td>
                  <td className="p-2 border">{emp.apellido}</td>
                  <td className="p-2 border">{emp.correo}</td>
                  <td className="p-2 border">{emp.username}</td>
                  <td className="p-2 border">{emp.puesto_trabajo}</td>
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => {
                        setEmpleadoSeleccionado(emp);
                        setModalDesempeñoOpen(true);
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Asignar desempeño
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {modalDesempeñoOpen && empleadoSeleccionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-[90%] max-w-lg">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Asignar desempeño a {empleadoSeleccionado.nombre}{" "}
                {empleadoSeleccionado.apellido}
              </h3>

              <div className="flex flex-col gap-2">
                <label htmlFor="rendimiento">Rendimiento (0.0 - 10.0):</label>
                <input
                  id="rendimiento"
                  onChange={(e) => setRendimiento(e.target.value)}
                  value={rendimiento}
                  placeholder="Ej: 8.75"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="border p-2 rounded"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  disabled={rendimiento.length === 0}
                  onClick={handleAsignarDesempeño}
                  className="disabled:opacity-50 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => {
                    setEmpleadoSeleccionado(null);
                    setModalDesempeñoOpen(false);
                    setRendimiento("");
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-right">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
