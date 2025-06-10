import { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { NotificationsList } from "../components/notifications/NotificationsList";
import { format } from "date-fns";

function mapNotificacionApiToFrontend(n) {
  return {
    id: n.id.toString(),
    titulo: n.mensaje,
    contenido: n.mensaje,
    opened: n.leida,
    fecha_creacion: n.fecha_creacion,
  };
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionActiva, setNotificacionActiva] = useState(null);

  const rol = localStorage.getItem("rol") || "reclutador";

  const endpointBase = {
    candidato: "candidato",
    manager: "manager",
    "admin-emp": "admin-emp",
    reclutador: "reclutador",
    empleado: "empleado",
  }[rol] || "reclutadores";

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const res1 = await fetch(
          `${import.meta.env.VITE_API_URL}/api/notificaciones-${endpointBase}-todas`,
          { credentials: "include" }
        );
        const json = await res1.json();
        const mapped = json.notificaciones.map(mapNotificacionApiToFrontend);
        setNotificaciones(mapped);
      } catch (e) {
        console.error("Error al traer notificaciones", e);
      }
    };

    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 2000);
    return () => clearInterval(interval);
  }, [endpointBase]);

  const handleSelect = (id) => {
    setNotificaciones((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, opened: true } : notif
      )
    );
    const selected = notificaciones.find((n) => n.id === id);
    if (selected) setNotificacionActiva({ ...selected, opened: true });
  };

  return (
    <section className="bg-white">
      <PageLayout>
        <TopBar
          username={`Usuario prueba`}
          style={{ backgroundColor: "#dddddd" }}
        />

        <div className="flex h-[calc(100vh-60px)]">
          <NotificationsList
            onSelect={handleSelect}
            notificacionActivaId={notificacionActiva?.id}
            notificaciones={notificaciones}
          />
          <NotificationActive notificacionActiva={notificacionActiva} />
        </div>
      </PageLayout>
    </section>
  );
}

function NotificationActive({ notificacionActiva }) {
  if (!notificacionActiva) {
    return (
      <div className="flex-1 p-6 bg-gray-50 text-gray-500 text-sm flex items-center justify-center">
        Seleccioná una notificación para ver el detalle
      </div>
    );
  }

  let fechaFormateada = "Fecha no disponible";
  if (notificacionActiva?.fecha_creacion) {
    try {
      const fecha = new Date(notificacionActiva.fecha_creacion);
      if (!isNaN(fecha)) {
        fechaFormateada = format(fecha, "PPpp");
      }
    } catch (e) {
      console.warn("Fecha inválida:", notificacionActiva.fecha_creacion);
    }
  }

  return (
    <div className="flex-1 p-6 bg-white border-l">
      <h2 className="text-xl font-semibold mb-2">{notificacionActiva.titulo}</h2>
      <p className="text-sm text-gray-500 mb-4">{fechaFormateada}</p>
      <p className="text-gray-700">{notificacionActiva.contenido}</p>
    </div>
  );
}
