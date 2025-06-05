import { motion } from "framer-motion";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./shadcn/Accordion";

const seccionesAmigables = {
  licencias: "Licencias",
  ofertas: "Ofertas",
  empleados: "Empleados",
  metricas: "Métricas y Desempeño",
};

export function AccionesPorSeccion({ accionesPorSeccion, estilos }) {
  return (
    <Accordion type="multiple" collapsible className="w-full">
      {Object.entries(accionesPorSeccion).map(([seccionKey, acciones]) => (
        <AccordionItem key={seccionKey} value={seccionKey}>
          <AccordionTrigger className="text-black">
            {seccionesAmigables[seccionKey]}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {acciones.map(
                ({ icon: Icon, titulo, descripcion, onClick }, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
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
                    <h3 className="text-base font-semibold">{titulo}</h3>
                    <p className="text-sm mt-1">{descripcion}</p>
                  </motion.div>
                )
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
