import { motion } from "framer-motion";

export function AccionesSinSeccion({ acciones, estilos }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {acciones.map(({ icon: Icon, titulo, descripcion, onClick }, idx) => (
        <motion.div
          key={idx}
          onClick={onClick}
          className="cursor-pointer border p-5 rounded-xl shadow-sm hover:shadow-md"
          style={{
            backgroundColor: estilos.color_secundario,
            borderColor: estilos.color_principal,
            color: estilos.color_texto,
          }}
        >
          <Icon
            className="w-6 h-6 mb-2"
            style={{ color: estilos.color_principal }}
          />
          <h3
            className="text-base font-semibold"
            style={{ color: estilos.color_texto }}
          >
            {titulo}
          </h3>
          <p className="text-sm mt-1" style={{ color: estilos.color_texto }}>
            {descripcion}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
