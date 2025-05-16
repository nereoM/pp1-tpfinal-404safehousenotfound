import { format } from 'date-fns';
import { useState } from "react";

const MIN_LENGTH = 4;

export function useSolicitarLicencia({ onSuccess, onError, service }) {
  const [topMessage, setTopMessage] = useState("");
  const [formState, setFormState] = useState({
    descripcion: "",
    tipoLicencia: "",
    certificado: null,
    fecha: {
      from: null,
      to: null
    },
  });

  const solicitarLicencia = async () => {
    if (
      formState.tipoLicencia.trim().length < MIN_LENGTH
    ) {
      setTopMessage(`El tipo de licencia debe estar definido`);
      return;
    }

    // Si el tipo de licencia es distinto a vacaciones, el certificado es obligatorio
    if (formState.tipoLicencia !== "vacaciones" && !formState.certificado) {
      setTopMessage(`El certificado es obligatorio`);
      return;
    }

    if (!formState.fecha.from || !formState.fecha.to) {
      setTopMessage(`Las fechas son obligatorias`);
      return;
    }

    const fechaInicio = format(formState.fecha.from, "yyyy-MM-dd");
    const fechaFin = format(formState.fecha.to, "yyyy-MM-dd");

    // la funcion esta parametrizada, porque si usaria empleadoService.solicitarLicencia,
    // por abajo estaria haciendo una peticion al endpoint exclusivo del empleado,
    // por lo tanto cuando se use este hook en la page del reclutador estaria siempre tirando error
    try {
      let certificadoUrl = null;

      if (formState.tipoLicencia !== "vacaciones") {
        const response = await service.subirCertificado({ file: formState.certificado });
        certificadoUrl = response.certificado_url;
      }

      await service.solicitarLicencia({
        ...formState,
        certificadoUrl,
        fechaFin,
        fechaInicio,
      });

      setTopMessage("Solicitud creada correctamente");
      setFormState({ descripcion: "", tipoLicencia: "" });
      onSuccess();
    } catch (err) {
      onError?.();
      setTopMessage(err.message);
    }
  }

  const updateDescription = (newDescription) => {
    setFormState({ ...formState, descripcion: newDescription })
  }

  const updateTipoLicencia = (newTipoLicencia) => {
    setFormState({ ...formState, tipoLicencia: newTipoLicencia })
  }

  const updateFecha = (newFecha) => {
    console.log({ newFecha });
    setFormState({ ...formState, fecha: newFecha })
  }

  const updateCertificado = (certificado) => {
    if (certificado.type !== "application/pdf") {
      setTopMessage("Solo se permite subir archivos PDF.");
      return;
    }
    setFormState({ ...formState, certificado })
  }

  return { topMessage, solicitarLicencia, updateDescription, updateTipoLicencia, formState, updateCertificado, updateFecha }
}