import { useEffect, useState } from "react";

export function useLicenciasACargo({ service }) {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const [mensajeEvaluacion, setMensajeEvaluacion] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);

  useEffect(() => {
    setLoading(true);

    service
      .obtenerLicenciasACargo()
      .then(setLicencias)
      .then((err) => {
        console.error(err.message);
        setError("Error al cargar las licencias.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [service]);

  const sugerirFechas = async () => {
    return service
      .evaluarLicencia({
        idLicencia: licenciaSeleccionada.id_licencia,
        fechaFinSugerida: licenciaSeleccionada.fecha_fin,
        fechaInicioSugerida: licenciaSeleccionada.fecha_inicio,
        estado: "sugerencia",
      })
      .then((res) => {
        setMensajeEvaluacion(
          res.message || "Estado actualizado correctamente."
        );
        setMotivoRechazo("");

        setLicencias((prevState) =>
          prevState.map(
            (licencia) => {
              if (licencia.id_licencia !== licenciaSeleccionada.id_licencia) {
                return licencia
              }

              return {
                ...licencia,
                estado: "sugerencia"
              }
            }
          )
        );
      })
      .catch((err) => {
        console.error("Error al evaluar licencia:", err);
        setMensajeEvaluacion(err.message || "Error al pçrocesar la solicitud.");
      });
  };

  const evaluarLicencia = async () => {
    return service
      .evaluarLicencia({
        idLicencia: licenciaSeleccionada.id_licencia,
        fecha_fin: licenciaSeleccionada.fecha_fin,
        fecha_inicio: licenciaSeleccionada.fecha_inicio,
        estado: "",
        motivo: "",
      })
      .then((res) => {
        setMensajeEvaluacion(
          res.message || "Estado actualizado correctamente."
        );
        setMotivoRechazo("");
      })
      .catch((err) => {
        console.error("Error al evaluar licencia:", err);
        setMensajeEvaluacion(err.message || "Error al pçrocesar la solicitud.");
      });
  };

  return {
    licencias,
    error,
    loading,
    evaluarLicencia,
    mensajeEvaluacion,
    setError,
    motivoRechazo,
    setLicencias,
    licenciaSeleccionada,
    setLicenciaSeleccionada,
    sugerirFechas,
  };
}
