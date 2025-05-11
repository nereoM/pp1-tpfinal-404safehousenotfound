import { useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function SubirCertificadoModal({ onClose, idLicencia }) {
  const [topMessage, setTopMessage] = useState("");

  const handleSubmit = (e) => {
    console.log("ENVIANDO");

    e.preventDefault();

    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    if (!file) {
      setTopMessage("Subir un archivo valido");
      return;
    }

    empleadoService
      .subirCertificado({ file, idLicencia })
      .then(() => setTopMessage("Certificado subido correctamente"))
      .catch((err) => setTopMessage(err.message));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Subir certificado</h2>

        {topMessage && <header className="text-red-500">{topMessage}</header>}

        <form onSubmit={handleSubmit}>
          <section className="flex flex-col gap-2">
            <label htmlFor="">Subir archivo</label>
            <input type="file" />
          </section>
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
