import { motion } from "framer-motion";
import { LayoutGrid, Rows4 } from 'lucide-react';
import { useState } from 'react';
import { AccionesPorSeccion } from "./AccionesPorSeccion";
import { AccionesSinSeccion } from "./AccionesSinSeccion";

function mapAccionesPorSeccionToAcciones(accionesPorSeccion) {
  return Object.values(accionesPorSeccion).flat();
}

export function Acciones({ estilos, acciones }) {
  const [mostrarAccionesPorSeccion, setMostrarAccionesPorSeccion] =
    useState(true);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
      <div className="md:col-span-3 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-3xl space-y-4"
        >
          <h2
            className="text-lg font-semibold"
            style={{
              color: estilos.color_texto,
              textAlign: "center",
            }}
          >
            Acciones disponibles
          </h2>
          <section
            className="flex justify-end items-center gap-2"
            style={{
              color: estilos.color_texto,
            }}
          >
            <button
              data-active={mostrarAccionesPorSeccion ? "" : null}
              className="data-active:opacity-100 opacity-30 p-2 rounded-xl"
              style={{
                background: estilos.color_principal,
              }}
              onClick={() => setMostrarAccionesPorSeccion(true)}
            >
              <Rows4 />
            </button>
            <button
              style={{
                background: estilos.color_principal,
              }}
              data-active={mostrarAccionesPorSeccion ? "" : null}
              className="data-active:opacity-30 opacity-100 p-2 rounded-xl"
              onClick={() => setMostrarAccionesPorSeccion(false)}
            >
              <LayoutGrid />
            </button>
          </section>
          {mostrarAccionesPorSeccion ? (
            <AccionesPorSeccion
              accionesPorSeccion={acciones}
              estilos={estilos}
            />
          ) : (
            < AccionesSinSeccion
              acciones={mapAccionesPorSeccionToAcciones(acciones)}
              estilos={estilos}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
