import { Dialog, DialogContent, DialogTitle } from "../../shadcn/Dialog";

export function VerEncuestaModal({ open, onClose, encuesta }) {
  if (!encuesta) return null;

  // Datos mock de respuestas individuales
  const respuestasMock = [
    { nombre: "Juan Pérez", respondio: true },
    { nombre: "Lucía Gómez", respondio: true },
    { nombre: "Mauro Ibáñez", respondio: false },
    { nombre: "Sandra López", respondio: true },
    { nombre: "Carlos Duarte", respondio: false },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl space-y-4">
        <DialogTitle className="text-xl font-bold text-black">
          {encuesta.titulo}
        </DialogTitle>

        <div className="space-y-1 text-sm text-gray-700">
          <p><b>Descripción:</b> {encuesta.descripcion}</p>
          <p><b>Fecha de publicación:</b> {encuesta.fecha_inicio}</p>
          <p><b>Fecha de cierre:</b> {encuesta.fecha_fin}</p>
          <p><b>Respuestas:</b> {encuesta.respuestas}/{encuesta.total} respondieron</p>
        </div>

        <div className="mt-4">
          <h4 className="text-md font-semibold text-black mb-2">Estado de respuesta por empleado</h4>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2">Empleado</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {respuestasMock.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{r.nombre}</td>
                    <td className="px-3 py-2">
                      {r.respondio ? (
                        <span className="text-green-600 font-medium">Respondió</span>
                      ) : (
                        <span className="text-red-600 font-medium">No respondió</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
