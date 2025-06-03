import { useState } from "react";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { NotificationActive } from "../components/notifications/NotificationActive";
import { NotificationsList } from "../components/notifications/NotificationsList";

const initialNotificaciones = [
  {
    id: "1",
    titulo: "Nueva oferta publicada",
    contenido: "Se ha publicado una nueva oferta laboral para el área de IT.",
    opened: false,
    fecha_creacion: "2025-05-30T10:00:00Z",
  },
  {
    id: "2",
    titulo: "Licencia aprobada",
    contenido:
      "Tu solicitud de licencia ha sido aprobada por Recursos Humanos.",
    opened: true,
    fecha_creacion: "2025-05-27T14:30:00Z",
  },
  {
    id: "3",
    titulo: "Actualización de métricas",
    contenido: "Las métricas del equipo han sido actualizadas con éxito.",
    opened: false,
    fecha_creacion: "2025-05-15T09:15:00Z",
  },
  {
    id: "4",
    titulo: "Recordatorio de reunión",
    contenido: "No olvides la reunión semanal con el equipo de analistas.",
    opened: true,
    fecha_creacion: "2025-04-25T12:00:00Z",
  },
  {
    id: "5",
    titulo: "Nuevo mensaje del administrador",
    contenido:
      "Revisá el mensaje urgente enviado por el administrador del sistema.",
    opened: false,
    fecha_creacion: "2025-05-01T08:00:00Z",
  },
  {
    id: "6",
    titulo: "Cambio en políticas de RRHH",
    contenido: "Las políticas de trabajo remoto han sido actualizadas.",
    opened: true,
    fecha_creacion: "2025-05-20T16:45:00Z",
  },
  {
    id: "7",
    titulo: "Actualización del sistema",
    contenido: "El sistema se actualizará el próximo fin de semana.",
    opened: false,
    fecha_creacion: "2025-06-01T10:00:00Z",
  },
];

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState(initialNotificaciones);
  const [notificacionActiva, setNotificacionActiva] = useState(null);

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
