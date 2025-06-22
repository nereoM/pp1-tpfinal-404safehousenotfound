import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { seccionesAmigables } from "./AccionesPorSeccion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./shadcn/Command";
import { Dialog, DialogContent } from "./shadcn/Dialog";

export function SearchModal({ actions }) {
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      setIsOpen(true);
    },
    {
      enableOnFormTags: true,
    }
  );

  const handleActionSelect = (action) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Buscar acciones..." />
          <CommandList>
            <CommandEmpty>No se encontraron acciones.</CommandEmpty>
            {Object.entries(actions).map(([seccion, acciones]) => (
              <CommandGroup
                key={seccion}
                heading={seccionesAmigables[seccion].value}
              >
                {acciones.map((accion, index) => {
                  const Icon = accion.icon;
                  return (
                    <CommandItem
                      key={`${seccion}-${index}`}
                      value={`${accion.titulo} ${accion.descripcion}`}
                      onSelect={() => handleActionSelect(accion)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{accion.titulo}</span>
                        <span className="text-sm text-muted-foreground">
                          {accion.descripcion}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
