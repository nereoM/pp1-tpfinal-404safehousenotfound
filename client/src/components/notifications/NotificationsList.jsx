import {
  Calendar,
  CheckCheck,
  Clock,
  FolderOpen,
  MessageSquareDot,
} from "lucide-react";
import { useMemo } from "react";
import { useEstiloEmpresa } from "../../context/EstiloEmpresaContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../shadcn/Accordion";

export function NotificationsList({
  notificaciones,
  notificacionActivaId,
  onSelect,
}) {
  const { estilos } = useEstiloEmpresa();
  const primary = estilos?.color_principal ?? "#2563eb";

  // ✅ Lógica funcional basada en fechas absolutas
  const ahora = useMemo(() => new Date(), []);
  const hace7Dias = useMemo(
    () => new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000),
    [ahora]
  );
  const hace30Dias = useMemo(
    () => new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000),
    [ahora]
  );

  const ultimos7 = [];
  const ultimoMes = [];
  const masAntiguas = [];

  notificaciones.forEach((n) => {
    const fecha = new Date(n.fecha_creacion);
    if (isNaN(fecha)) return;

    if (fecha >= hace7Dias) {
      ultimos7.push(n);
    } else if (fecha >= hace30Dias) {
      ultimoMes.push(n);
    } else {
      masAntiguas.push(n);
    }
  });

  // ✅ Render de grupo con estilos visuales
  const renderGrupo = (items) =>
    items.length === 0 ? (
      <p className="text-sm text-gray-400 px-4 py-2">Sin notificaciones</p>
    ) : (
      <ul>
        {items.map((notif) => (
          <li
            key={notif.id}
            onClick={() => onSelect(notif.id)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors duration-100 ${
              notif.id === notificacionActivaId ? "bg-blue-100" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{notif.titulo}</span>
              {!notif.opened ? (
                <span className="text-blue-500 text-sm ml-2">●</span>
              ) : (
                <span className="text-gray-400 flex items-center gap-1 text-xs">
                  <CheckCheck className="w-4 h-4" />
                  Ya leído
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <aside className="w-1/3 border-r overflow-y-auto bg-gray-50">
      <h2 className="text-lg font-bold p-4 border-b flex items-center gap-2">
        <MessageSquareDot />
        Notificaciones
      </h2>

      <Accordion
        type="single"
        defaultValue="recientes"
        collapsible
        className="w-full"
      >
        <AccordionItem value="recientes">
          <AccordionTrigger className="px-4">
            <Clock style={{ color: "var(--primary)" }} className="size-5 custom" />
            Últimos 7 días
          </AccordionTrigger>
          <AccordionContent>{renderGrupo(ultimos7)}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="esteMes">
          <AccordionTrigger className="px-4">
            <Calendar style={{ color: "var(--primary)" }} className="size-5 custom" />
            Último mes
          </AccordionTrigger>
          <AccordionContent>{renderGrupo(ultimoMes)}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="viejas">
          <AccordionTrigger className="px-4">
            <FolderOpen style={{ color: "var(--primary)" }} className="size-5 custom" />
            Más antiguas
          </AccordionTrigger>
          <AccordionContent>{renderGrupo(masAntiguas)}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
