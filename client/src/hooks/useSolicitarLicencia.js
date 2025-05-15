import { useState } from "react";

const MIN_LENGTH = 4;

export function useSolicitarLicencia({ onSuccess, service }) {
  const [topMessage, setTopMessage] = useState("");
  const [formState, setFormState] = useState({
    descripcion: "",
    tipoLicencia: "",
    certificado: null,
  });

  const solicitarLicencia = () => {
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

    // la funcion esta parametrizada, porque si usaria empleadoService.solicitarLicencia,
    // por abajo estaria haciendo una peticion al endpoint exclusivo del empleado,
    // por lo tanto cuando se use este hook en la page del reclutador estaria siempre tirando error
    service.subirCertificado({ file: formState.certificado })
      .then(response => {
        service.solicitarLicencia({ ...formState, certificadoUrl: response.certificado_url })
          .then(() => {
            setTopMessage("Solicitud creada correctamente");
            setFormState({ descripcion: "", tipoLicencia: "" });
            onSuccess();
          })
          .catch((err) => {
            setTopMessage(err.message);
          })
      }).catch((err) => {
        setTopMessage(err.message);
      })
  }

  const updateDescription = (newDescription) => {
    setFormState({ ...formState, descripcion: newDescription })
  }

  const updateTipoLicencia = (newTipoLicencia) => {
    setFormState({ ...formState, tipoLicencia: newTipoLicencia })
  }

  const updateCertificado = (certificado) => {
    if (certificado.type !== "application/pdf") {
      setTopMessage("Solo se permite subir archivos PDF.");
      return;
    }
    setFormState({ ...formState, certificado })
  }

  return { topMessage, solicitarLicencia, updateDescription, updateTipoLicencia, formState, updateCertificado }
}