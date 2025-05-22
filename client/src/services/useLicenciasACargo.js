import { useEffect, useState } from "react";
import { managerService } from "./managerService";

export function useLicenciasACargo() {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const [mensajeEvaluacion, setMensajeEvaluacion] = useState("")
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);

  useEffect(() => {
    setLoading(true);

    managerService
      .obtenerLicenciasEmpleadosReclutadores()
      .then(setLicencias)
      .then((err) => {
        console.error(err.message);
        setError("Error al cargar las licencias.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const evaluarLicencia = async () => {
    return managerService.evaluarLicencia({
      idLicencia: licenciaSeleccionada.id_licencia,
      fecha_fin: licenciaSeleccionada.fecha_fin,
      fecha_inicio: licenciaSeleccionada.fecha_inicio,
      estado: "",
      motivo: "",
    }).then((res) => {
      setMensajeEvaluacion(res.message || "Estado actualizado correctamente.");
      setMotivoRechazo("");
    }).catch((err) => {
      console.error("Error al evaluar licencia:", err);
      setMensajeEvaluacion(err.message || "Error al pçrocesar la solicitud.");
    })
  }

  return { licencias, error, loading, evaluarLicencia, mensajeEvaluacion, setError, motivoRechazo, setLicencias, licenciaSeleccionada, setLicenciaSeleccionada };
}
