import { useEffect, useState } from "react";
import { reclutadorService } from "../services/reclutador";

export default function ReclutadorOfertas() {
  const [ofertas, setOfertas] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true)
    reclutadorService.obtenerOfertas().then(setOfertas).finally(() => {
      setIsLoading(false)
    }).catch(() => {
      setIsError(true)
    })
  }, [])

  if (isLoading) return <section>Cargando...</section>
  if (isError) return <section>Error al cargar las ofertas</section>

  return (
    <section>
      <ul>
        {ofertas?.map(oferta =>
          <li key={oferta.id}>
            {oferta.nombre}
          </li>
        )
        }
      </ul>
    </section>
  )
}
