import '../types';

import { useEffect, useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function useOfertasRecomendadas() {
  /** @type {[Oferta[]]} */
  const [ofertas, setOfertas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);

    // Cargar ofertas
    empleadoService
      .obtenerRecomendaciones()
      .then((data) => {
        setOfertas(
          data.map((d) => ({
            id: d.id_oferta,
            titulo: d.nombre_oferta,
            empresa: d.empresa,
            palabrasClave: d.palabras_clave,
            fecha: "Reciente",
            postulaciones: Math.floor(Math.random() * 100),
          }))
        );
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { ofertas, isLoading, error };
}
