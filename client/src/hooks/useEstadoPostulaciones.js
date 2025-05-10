import { useEffect, useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function useEstadoPostulaciones() {
  /** @type {[EstadoPostulacion[]]} */
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log({ postulaciones });

  useEffect(() => {
    setLoading(true);

    empleadoService
      .obtenerEstadoPostulaciones()
      .then(setPostulaciones)
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { postulaciones, loading, error };
}
