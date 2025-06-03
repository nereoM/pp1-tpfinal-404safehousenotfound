import { differenceInDays, parseISO } from "date-fns";
import {
  Calendar,
  CheckCheck,
  Clock,
  FolderOpen,
  MessageSquareDot,
} from "lucide-react";
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

  const grouped = {
    recientes: [],
    esteMes: [],
    viejas: [],
  };

  notificaciones.forEach((notif) => {
    const diff = differenceInDays(new Date(), parseISO(notif.fecha_creacion));
    if (diff <= 7) {
      grouped.recientes.push(notif);
    } else if (diff <= 30) {
      grouped.esteMes.push(notif);
    } else {
      grouped.viejas.push(notif);
    }
  });

  const renderGroup = (items) =>
    items.length === 0 ? (
      <p className="text-sm text-gray-400 px-4 py-2">Sin notificaciones</p>
    ) : (
      <ul>
        {items.map((notif) => (
          <li
            key={notif.id}
            onClick={() => onSelect(notif.id)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
              notif.id === notificacionActivaId ? "bg-gray-200" : ""
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
            <Clock style={{ color: primary }} className="size-5 custom" />{" "}
            Últimos 7 días
          </AccordionTrigger>
          <AccordionContent>{renderGroup(grouped.recientes)}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="esteMes">
          <AccordionTrigger className="px-4">
            <Calendar style={{ color: primary }} className="size-5 custom" />{" "}
            Último mes
          </AccordionTrigger>
          <AccordionContent>{renderGroup(grouped.esteMes)}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="viejas">
          <AccordionTrigger className="px-4">
            <FolderOpen style={{ color: primary }} className="size-5 custom" />{" "}
            Más antiguas
          </AccordionTrigger>
          <AccordionContent>{renderGroup(grouped.viejas)}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
