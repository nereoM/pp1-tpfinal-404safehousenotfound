import { format } from 'date-fns';
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
    const fechaInicioSugerida = format(licenciaSeleccionada.fecha_inicio, "yyyy-MM-dd");
    const fechaFinSugerida = format(licenciaSeleccionada.fecha_fin, "yyyy-MM-dd");

    return service
      .evaluarLicencia({
        idLicencia: licenciaSeleccionada.id_licencia,
        fechaFinSugerida,
        fechaInicioSugerida,
        estado: "sugerencia",
      })
      .then((res) => {
        setMensajeEvaluacion(
          res.message || "Estado actualizado correctamente."
        );

        setLicencias((prevState) =>
          prevState.map((item) => {
            if (item.licencia.id_licencia !== licenciaSeleccionada.id_licencia) {
              return item;
            }

            return {
              ...item,
              licencia: {
                ...item.licencia,
                estado: "sugerencia",
              },
            };
          })
        );
      })
      .catch((err) => {
        console.error("Error al evaluar licencia:", err);
        setMensajeEvaluacion(err.message || "Error al pçrocesar la solicitud.");
      });
  };

  const evaluarLicencia = async ({ estado, idLicencia }) => {
    return service
      .evaluarLicencia({
        motivo: motivoRechazo ?? "",
        estado,
        idLicencia,
      })
      .then((res) => {
        setMensajeEvaluacion(res.message || "Licencia actualizada correctamente.");

        // Actualiza el estado de la licencia instantaneamente
        setLicencias((prevState) =>
          prevState.map((item) => {
            if (item.licencia.id_licencia !== idLicencia) {
              return item;
            }

            return {
              ...item,
              licencia: {
                ...item.licencia,
                estado,
              },
            };
          })
        );
      })
      .catch((err) => {
        console.error("Error al evaluar licencia:", err);
        setMensajeEvaluacion(err.message || "Error al evaluar la licencia.");
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
    setMotivoRechazo
  };
}
