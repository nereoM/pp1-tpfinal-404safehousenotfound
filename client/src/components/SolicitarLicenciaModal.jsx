import { Check, ChevronsUpDown, FileCheck, UploadCloud } from "lucide-react";
import { licenciasLaborales } from "../data/constants/tipo-licencias";
import { useSolicitarLicencia } from "../hooks/useSolicitarLicencia";
import { cn } from "../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./shadcn/Command";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "./shadcn/Popover";

export function SolicitarLicenciaModal({ onClose, service }) {
  const {
    solicitarLicencia,
    topMessage,
    updateDescription,
    updateTipoLicencia,
    updateCertificado,
    formState,
  } = useSolicitarLicencia({
    service,
    onSuccess() {
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    solicitarLicencia();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4 text-black">
        <h2 className="text-xl font-semibold">Solicitud de Licencia</h2>

        {topMessage && (
          <div className="text-sm text-gray-100 bg-indigo-600 p-2 rounded">
            {topMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  className={cn(
                    "flex justify-between w-full p-2 border border-gray-300 rounded",
                    !formState.tipoLicencia && "text-muted-foreground"
                  )}
                >
                  {formState.tipoLicencia
                    ? licenciasLaborales.find(
                        (language) => language.value === formState.tipoLicencia
                      )?.label
                    : "Selecciona el tipo de licencia"}
                  <ChevronsUpDown className="opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar tipo de licencia..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>Tipo de licencia no encontrada.</CommandEmpty>
                    <CommandGroup>
                      {licenciasLaborales.map((language) => (
                        <CommandItem
                          value={language.label}
                          key={language.value}
                          onSelect={() => {
                            updateTipoLicencia(language.value);
                          }}
                        >
                          <PopoverClose className="flex justify-between w-full">
                            {language.label}
                            <Check
                              className={cn(
                                "ml-auto",
                                language.value === formState.tipoLicencia
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </PopoverClose>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div>
              <label className="text-sm font-medium">
                Descripción (Opcional)
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Motivo o detalles adicionales"
                value={formState.descripcion}
                onChange={(e) => updateDescription(e.target.value)}
              ></textarea>
            </div>

            {formState.tipoLicencia &&
              formState.tipoLicencia !== "vacaciones" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Adjuntar certificado en formato PDF
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-primary-500 transition-colors cursor-pointer">
                    <input
                      id="certificado-upload"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept=".pdf"
                      type="file"
                      onChange={(e) => {
                        if (e.target.files.length > 0) {
                          updateCertificado(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center text-gray-500">
                      <UploadCloud className="h-8 w-8 mb-1" />
                      <span className="text-sm">
                        Haz click o arrastra tu certificado PDF aquí
                      </span>
                    </div>
                  </div>
                  {formState.certificado && (
                    <div className="mt-2 flex items-center space-x-2 text-green-600">
                      <FileCheck className="w-5 h-5" />
                      <span className="text-sm">
                        {formState.certificado.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
