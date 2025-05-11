import { useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function SubirCertificadoModal({ onClose, idLicencia }) {
  const [topMessage, setTopMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    // Validar si el archivo es un PDF
    if (!file) {
      setTopMessage("Por favor, selecciona un archivo.");
      return;
    }

    if (file.type !== "application/pdf") {
      setTopMessage("Solo se permite subir archivos PDF.");
      return;
    }

    empleadoService
      .subirCertificado({ file, idLicencia })
      .then(() => setTopMessage("Certificado subido correctamente"))
      .catch((err) => setTopMessage(err.message));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl space-y-6">
        <h2 className="text-2xl font-semibold text-center text-gray-800">Subir Certificado</h2>

        {/* Mensaje de estado */}
        {topMessage && (
          <header
            className={`text-sm ${topMessage.includes("correctamente") ? "text-green-500" : "text-red-500"} font-medium text-center`}
          >
            {topMessage}
          </header>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="flex flex-col gap-3">
            <label htmlFor="certificado" className="text-gray-700 font-medium">Selecciona el archivo PDF</label>
            <input
              type="file"
              id="certificado"
              accept=".pdf"  // Acepta solo archivos PDF
              className="border-2 border-gray-300 p-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </section>

          {/* Botones */}
          <div className="flex justify-between gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-300 rounded-lg text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
