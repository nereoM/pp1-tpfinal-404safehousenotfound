import "../types";

import { useEffect, useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function useOfertasRecomendadas() {
  /** @type {[Oferta[]]} */
  const [ofertas, setOfertas] = useState([]);
  const [ofertasIsLoading, setOfertasIsLoading] = useState(false);
  const [ofertasError, setOfertasError] = useState("");

  useEffect(() => {
    setOfertasIsLoading(true);

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
        setOfertasError(err.message);
      })
      .finally(() => {
        setOfertasIsLoading(false);
      });
  }, []);

  const handlerAplicarFiltros = (filtros) => {
    empleadoService
      .obtenerOfertasFiltradas(filtros)
      .then((data) => {
        const transformadas = data.map((item) => ({
          id: item.id,
          titulo: item.nombre_oferta,
          empresa: item.empresa,
          palabrasClave: item.palabras_clave,
          fecha: "Reciente",
          postulaciones: Math.floor(Math.random() * 100),
        }));
        setOfertas(transformadas);
      })
      .catch((err) => {
        setOfertasError(err.message);
      });
  };

  return { ofertas, ofertasIsLoading, ofertasError, handlerAplicarFiltros };
}
