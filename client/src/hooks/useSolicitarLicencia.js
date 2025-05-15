import { useState } from "react";

const MIN_LENGTH = 5;

export function useSolicitarLicencia({ onSuccess, serviceFn }) {
  const [topMessage, setTopMessage] = useState("");
  const [formState, setFormState] = useState({
    descripcion: "",
    tipoLicencia: "",
  });

  const solicitarLicencia = () => {
    if (
      formState.tipoLicencia.trim().length < MIN_LENGTH
    ) {
      setTopMessage(`El tipo de licencia debe estar definido`);
      return;
    }

    // la funcion esta parametrizada, porque si usaria empleadoService.solicitarLicencia,
    // por abajo estaria haciendo una peticion al endpoint exclusivo del empleado,
    // por lo tanto cuando se use este hook en la page del reclutador estaria siempre tirando error
    serviceFn(formState)
      .then(() => {
        setTopMessage("Solicitud creada correctamente");
        setFormState({ descripcion: "", tipoLicencia: "" });
        onSuccess();
      })
      .catch((err) => {
        setTopMessage(err.message);
      });
  }

  const updateDescription = (newDescription) => {
    setFormState({ ...formState, descripcion: newDescription })
  }

  const updateTipoLicencia = (newTipoLicencia) => {
    setFormState({ ...formState, tipoLicencia: newTipoLicencia })
  }

  return { topMessage, solicitarLicencia, updateDescription, updateTipoLicencia, formState }
}