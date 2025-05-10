import { createContext, use, useEffect, useState } from "react";
import { empleadoService } from "../services/empleadoService";
import "../types";

const ofertasContext = createContext(null);

export const OfertasProvider = ({ children }) => {
  /** @type {[Oferta[]]} */
  const [ofertas, setOfertas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);

    // Cargar ofertas recomemndadas
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
        setError(err.message);
      });
  };

  return (
    <ofertasContext.Provider
      value={{
        ofertas,
        isLoading,
        error,
        handlerAplicarFiltros,
      }}
    >
      {children}
    </ofertasContext.Provider>
  );
};

export function useOfertasContext() {
  const values = use(ofertasContext);

  if (!values) {
    throw new Error("Usar este hook adentro de OfertasProvider");
  }

  return values;
}
