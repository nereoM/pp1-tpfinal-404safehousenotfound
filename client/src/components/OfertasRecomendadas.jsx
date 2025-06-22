import { motion } from "framer-motion";
import { JobCard } from '../components/JobCard';

export function OfertasRecomendadas({ onSelectOferta, ofertas, isLoading, error }) {
  if (error) {
    return <section>Hubo un error al cargar las ofertas</section>;
  }

  if (isLoading) {
    return <section>cargando ofertas...</section>;
  }

  if (!isLoading && !error && ofertas.length === 0) {
    return <section>No hay ofertas que cumplan los filtros de busqueda</section>;
  }

  return (
    <ul>
      {ofertas?.map((oferta, index) => (
        <motion.div
          key={`oferta-${oferta.id ?? index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <JobCard {...oferta} onPostularse={() => onSelectOferta(oferta.id)} />
        </motion.div>
      ))}
    </ul>
  );
}
