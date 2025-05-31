import React, { useRef } from "react";
import DOMPurify from "dompurify";

export default function ReporteRRHHExport({ titulo, secciones }) {
  const refReporte = useRef();

  const exportarPDF = async () => {
    const rawHtml = refReporte.current?.innerHTML;
    const safeHtml = DOMPurify.sanitize(rawHtml);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generar-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: safeHtml }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${titulo.toLowerCase().replaceAll(' ', '_')}.pdf`;
    link.click();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-800">{titulo}</h2>
        <button
          onClick={exportarPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Descargar PDF
        </button>
      </div>

      <div ref={refReporte} className="bg-white p-6 rounded shadow-md text-sm text-black">
        {secciones.map((seccion, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="text-xl font-semibold text-blue-700 border-b pb-1 mb-4">{seccion.titulo}</h3>

            {seccion.tipo === "tabla" && (
              <table className="w-full border-collapse border text-center">
                <thead className="bg-blue-100">
                  <tr>
                    {seccion.columnas.map((col, i) => (
                      <th key={i} className="border px-4 py-2">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seccion.filas.map((fila, i) => (
                    <tr key={i}>
                      {seccion.columnas.map((col, j) => (
                        <td key={j} className="border px-4 py-2">{fila[col] !== undefined ? fila[col] : "-"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {seccion.tipo === "imagen" && (
              <div className="text-center mt-6">
                <img
                  src={`data:image/png;base64,${seccion.base64}`}
                  alt={seccion.alt || "Gráfico"}
                  className="mx-auto max-w-full h-auto"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
