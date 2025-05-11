import { useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function SubirCertificadoModal({ onClose, idLicencia }) {
  const [topMessage, setTopMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false); 

  const handleSubmit = async (e) => {
    console.log("ENVIANDO");

    e.preventDefault();

    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    if (!file) {
      setTopMessage("Subir un archivo válido");
      setIsError(true);
      return;
    }

    // Reseteo de mensaje y activación del loader
    setTopMessage("");
    setIsError(false);
    setIsLoading(true);

    try {
      await empleadoService.subirCertificado({ file, idLicencia });
      setTopMessage("Certificado subido correctamente");
      setIsError(false);
    } catch (err) {
      if (err.message.includes("400")) {
        setTopMessage("La licencia no está aprobada. No se puede subir el certificado.");
      } else {
        setTopMessage(`Error: ${err.message}`);
      }
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Subir certificado</h2>

        {/* Mensaje de éxito o error */}
        {topMessage && (
          <header className={`text-${isError ? "red" : "green"}-500 font-semibold`}>
            {topMessage}
          </header>
        )}

        <form onSubmit={handleSubmit}>
          <section className="flex flex-col gap-2">
            <label htmlFor="">Subir archivo</label>
            <input type="file" disabled={isLoading} />
          </section>
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              disabled={isLoading}
            >
              Cerrar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              } text-white flex items-center gap-2`}
              disabled={isLoading}
            >
              {isLoading && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2z"
                  />
                </svg>
              )}
              {isLoading ? "Subiendo..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
