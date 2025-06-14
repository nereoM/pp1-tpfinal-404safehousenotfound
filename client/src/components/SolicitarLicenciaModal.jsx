import { Check, ChevronsUpDown, FileCheck, UploadCloud } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { toast } from "sonner";
import { Dialog, DialogContent } from "../components/shadcn/Dialog";
import { licenciasLaborales } from "../data/constants/tipo-licencias";
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

export function SolicitarLicenciaModal({ open, onOpenChange }) {
  const [formState, setFormState] = useState({
    tipoLicencia: "",
    descripcion: "",
    fecha: undefined,
    certificado: null,
    certificado_url: "",
    dias_requeridos: "",
  });
  const [subiendo, setSubiendo] = useState(false);
  const [bloqueado, setBloqueado] = useState(false); // Nuevo estado para bloquear modal

  const updateTipoLicencia = (tipo) =>
    setFormState((f) => ({ ...f, tipoLicencia: tipo }));
  const updateDescription = (desc) =>
    setFormState((f) => ({ ...f, descripcion: desc }));
  const updateFecha = (range) => setFormState((f) => ({ ...f, fecha: range }));
  const updateCertificado = (file) =>
    setFormState((f) => ({ ...f, certificado: file }));

  // Mapea el tipo de licencia del frontend al backend
  const mapTipoLicencia = (tipo) => {
    return tipo;
  };

  // Calcula días requeridos según el rango de fechas
  const calcularDias = () => {
    if (formState.fecha && formState.fecha.from && formState.fecha.to) {
      const diff =
        (formState.fecha.to - formState.fecha.from) / (1000 * 60 * 60 * 24) + 1;
      return diff;
    }
    return "";
  };

  // Función para validar que las fechas no sean anteriores a hoy
  const esFechaValida = () => {
    if (!formState.fecha || !formState.fecha.from) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const from = new Date(formState.fecha.from);
    if (from < hoy) return false;
    if (formState.fecha.to) {
      const to = new Date(formState.fecha.to);
      if (to < hoy) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBloqueado(true); // Bloquea el modal al enviar

    // Validar fechas
    if (!esFechaValida()) {
      toast.error("Selecciona fechas validas.");
      setBloqueado(false);
      return;
    }

    let certificado_url = formState.certificado_url;
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    // Selecciona el endpoint según el rol
    let endpointSolicitarLicencia = "/api/solicitar-licencia-empleado";
    let endpointSubirCertificado = "/api/subir-certificado-emp";

    if (rol === "reclutador") {
      endpointSolicitarLicencia = "/api/solicitar-licencia-reclutador";
      endpointSubirCertificado = "/api/subir-certificado";
    } else if (rol === "manager") {
      endpointSolicitarLicencia = "/api/solicitar-licencia-manager";
      endpointSubirCertificado = "/api/subir-certificado-manager";
    }

    // Si requiere certificado y hay archivo, súbelo primero
    if (
      formState.tipoLicencia &&
      formState.tipoLicencia !== "vacaciones" &&
      formState.certificado &&
      !certificado_url
    ) {
      setSubiendo(true);
      const data = new FormData();
      data.append("file", formState.certificado);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}${endpointSubirCertificado}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: data,
          }
        );
        let json = {};
        try {
          json = await res.json();
        } catch {
          throw new Error(
            "Respuesta inesperada del servidor al subir certificado"
          );
        }
        if (!res.ok)
          throw new Error(json.error || "Error al subir certificado");
        certificado_url = json.certificado_url;
        setFormState((f) => ({ ...f, certificado_url }));
      } catch (err) {
        toast.error(err.message);
        setSubiendo(false);
        setBloqueado(false);
        return;
      }
      setSubiendo(false);
    }

    // Prepara fechas y días requeridos
    let start_date = "";
    let end_date = "";
    let dias_requeridos = "";

    if (formState.fecha && formState.fecha.from) {
      start_date = formState.fecha.from.toISOString().slice(0, 10);
    }
    if (formState.fecha && formState.fecha.to) {
      end_date = formState.fecha.to.toISOString().slice(0, 10);
    }
    dias_requeridos = calcularDias();

    const body = {
      lic_type: mapTipoLicencia(formState.tipoLicencia),
      description: formState.descripcion,
      start_date,
      end_date: end_date || undefined,
      certificado_url: certificado_url || undefined,
      dias_requeridos: dias_requeridos || undefined,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}${endpointSolicitarLicencia}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      let json = {};
      let text = "";
      try {
        text = await res.text();
        json = JSON.parse(text);
      } catch {
        throw new Error(
          "Respuesta inesperada del servidor al solicitar licencia: " + text
        );
      }
      if (!res.ok) throw new Error(json.error || "Error al solicitar licencia");
      toast.success("Solicitud creada correctamente");
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBloqueado(false); // Desbloquea el modal al terminar
    }
  };

  // Calcular fecha mínima para el selector (hoy)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`text-black max-w-md w-[95vw] max-h-[90vh] overflow-auto ${bloqueado ? 'pointer-events-none opacity-60' : ''}`}>
        <h2 className="text-xl font-semibold">Solicitud de Licencia</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tipo de licencia
            </label>
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
              <label className="text-sm font-medium text-gray-700">
                Descripción (Opcional)
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Motivo o detalles adicionales"
                value={formState.descripcion}
                onChange={(e) => updateDescription(e.target.value)}
              ></textarea>
            </div>

            <section>
              <label className="text-sm font-medium text-gray-700">
                Rango de fechas
              </label>
              <DayPicker
                className="flex justify-center"
                mode="range"
                selected={formState.fecha}
                onSelect={updateFecha}
                disabled={{ before: hoy }}
              />
            </section>

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
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              type="button"
              disabled={subiendo || bloqueado}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              type="submit"
              disabled={subiendo || bloqueado}
            >
              {subiendo || bloqueado ? "Procesando..." : "Enviar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
