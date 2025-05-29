import { useEffect } from "react";
import { toPng } from "html-to-image";

export const useExportarGraficos = (lista, trigger = true) => {
  useEffect(() => {
    if (!trigger) return;

    const exportar = async () => {
      for (const { idElemento, nombreArchivo } of lista) {
        const nodo = document.getElementById(idElemento);
        if (!nodo) {
          console.warn(`No se encontró el elemento con id '${idElemento}'`);
          continue;
        }

        try {
          const dataUrl = await toPng(nodo);
          const blob = await (await fetch(dataUrl)).blob();

          const formData = new FormData();
          formData.append("imagen", blob, `${nombreArchivo}.png`);

          await fetch(`${import.meta.env.VITE_API_URL}/api/guardar-imagen-reporte`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
        } catch (error) {
          console.error(`Error exportando el gráfico '${nombreArchivo}':`, error);
        }
      }
    };

    exportar();
  }, [trigger, lista]);
};
