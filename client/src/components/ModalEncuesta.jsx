import { Dialog, DialogContent, DialogTitle } from "./shadcn/Dialog";
import { useState, useEffect } from "react";
import { authService } from "../services/authService";
import {
  PasoUnoEncuesta,
  PasoDosEncuesta,
  PasoDosEncuestaManager,
  PasoDosEncuestaAnalista,
  PasoTresEncuesta,
  PasoCuatroEncuesta,
  PasoCuatroEncuestaManager,
  PasoCuatroEncuestaAnalista,
} from "./EncuestaModal";

export function ModalEncuesta({ open, onOpenChange }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [roles, setRoles] = useState(null);

  const isAdmin = roles?.includes("admin-emp");
  const isManager = roles?.includes("manager");

  useEffect(() => {
    authService.obtenerInfoUsuario()
      .then(userInfo => {
        const rolesActuales = userInfo.roles || [];
        setRoles(rolesActuales);

        setFormData({
          tipo: "",
          titulo: "",
          descripcion: "",
          anonima: null,
          fechas: {
            from: null,
            to: null,
          },
          destinatario: null,
          correo: "",
          area: "",
          puesto: "",
          preguntas: [],
          envioATodos: true,
          correosAnalistas: [],
          emails: [],
        });
      })
      .catch(err => {
        console.error("Error obteniendo roles:", err);
        setRoles([]);
      });
  }, []);

  const handleClose = () => {
    setStep(1);
    setFormData({});
    onOpenChange(false);
  };

  const handleFinalizar = async () => {
    try {
      if (roles?.includes("manager") || roles?.includes("reclutador")) {
        // El Paso 4 personalizado se encarga de hacer el POST
        return;
      }

      let endpoint = "";
      let payload = {};

      if (isAdmin) {
        endpoint = "/api/encuestas/crear";
        const fechas = formData.fechas || {};
        payload = {
          tipo: formData.tipo || "general",
          titulo: formData.titulo,
          descripcion: formData.descripcion || undefined,
          anonima: false,
          fecha_inicio: fechas.from?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
          fecha_fin: fechas.to?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        };
      } else {
        // Jefe de empleados
        endpoint = "/api/crear-encuesta";
        const fechas = formData.fechas || {};
        payload = {
          tipo: formData.tipo,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          anonima: formData.anonima === "si",
          fecha_inicio: fechas.from?.toISOString().split("T")[0],
          fecha_fin: fechas.to?.toISOString().split("T")[0],
          emails: formData.destinatario === "empleado" ? formData.emails : (
            formData.destinatario === "lista_emails" ? formData.emails : null
          ),
          area: formData.destinatario === "area" ? formData.area : null,
          puesto_trabajo: formData.destinatario === "puesto" ? formData.puesto : null,
          preguntas: (formData.preguntas || []).map((p) => ({
            texto: p.texto,
            tipo:
              p.tipo === "opcion unica"
                ? "unica_opcion"
                : p.tipo === "opcion multiple"
                ? "opcion_multiple"
                : "respuesta_libre",
            opciones: p.opciones || [],
            es_requerida: !!p.es_requerida,
          })),
        };
      }

      const url = `${import.meta.env.VITE_API_URL}${endpoint}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Error status:", res.status);
        throw new Error("Error al crear encuesta");
      }

      handleClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="space-y-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-bold text-black">Crear Encuesta</DialogTitle>

        {roles === null ? (
          <p className="text-sm text-gray-500">Cargando permisos...</p>
        ) : (
          <>
            {step === 1 && (
              <PasoUnoEncuesta
                formData={formData}
                setFormData={setFormData}
                onNext={() => setStep(2)}
                onCancel={handleClose}
              />
            )}

            {step === 2 && (
              <>
                {roles.includes("manager") ? (
                  <PasoDosEncuestaManager
                    formData={formData}
                    setFormData={setFormData}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                    onCancel={handleClose}
                  />
                ) : roles.includes("reclutador") ? (
                  <PasoDosEncuestaAnalista
                    formData={formData}
                    setFormData={setFormData}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                    onCancel={handleClose}
                  />
                ) : (
                  <PasoDosEncuesta
                    formData={formData}
                    setFormData={setFormData}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                    onCancel={handleClose}
                  />
                )}
              </>
            )}

            {step === 3 && (
              <PasoTresEncuesta
                formData={formData}
                setFormData={setFormData}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
                onCancel={handleClose}
              />
            )}

            {step === 4 && (
              roles.includes("manager") ? (
                <PasoCuatroEncuestaManager
                  formData={formData}
                  onBack={() => setStep(3)}
                  onFinish={handleClose}
                  onCancel={handleClose}
                />
              ) : roles.includes("reclutador") ? (
                <PasoCuatroEncuestaAnalista
                  formData={formData}
                  onBack={() => setStep(3)}
                  onFinish={handleFinalizar}
                  onCancel={handleClose}
                />
              ) : (
                <PasoCuatroEncuesta
                  formData={formData}
                  onBack={() => setStep(3)}
                  onFinish={handleFinalizar}
                  onCancel={handleClose}
                />
              )
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
