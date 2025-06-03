import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function NotificationActive({ notificacionActiva }) {
  return (
    <main className="flex-1 p-6">
      {notificacionActiva ? (
        <>
          <h3 className="text-xl font-semibold mb-2">
            {notificacionActiva.titulo}
          </h3>
          <p className="text-gray-700 mb-4">{notificacionActiva.contenido}</p>
          <p className="text-sm text-gray-500">
            {format(parseISO(notificacionActiva.fecha_creacion), "PPP", {
              locale: es,
            })}
          </p>
          <p className="text-sm text-gray-500">
            Hace{" "}
            {formatDistanceToNow(parseISO(notificacionActiva.fecha_creacion), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </>
      ) : (
        <p className="text-gray-500">Selecciona una notificación</p>
      )}
    </main>
  );
}
