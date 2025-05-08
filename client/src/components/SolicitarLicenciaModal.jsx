import { useState } from "react";
import { empleadoService } from "../services/empleadoService";

export function SolicitarLicenciaModal({onClose}) {
  const [formState, setFormState] = useState({
    descripcion: "",
    tipoLicencia: "",
  });
  const [topMessage, setTopMessage] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault();

    empleadoService
      .solicitarLicencia(formState)
      .then(() => {
        setTopMessage("Solicitud creada correctamente")
        setFormState({descripcion: "", tipoLicencia: ""})
      })
      .catch((err) => {
        setTopMessage(err.message);
      });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">Solicitud de Licencia</h2>
        {
          topMessage && <header className="text-red-600">{topMessage}</header>
        }
        <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <label htmlFor="motivo">Descripcion</label>
            <input
              className="border"
              id="motivo"
              type="text"
              onChange={(e) =>
                setFormState({ ...formState, descripcion: e.target.value })
              }
            />
          </section>
          <section className="flex flex-col gap-2">
            <label htmlFor="motivo">Tipo de licencia</label>
            <input
              className="border"
              id="motivo"
              type="text"
              onChange={(e) =>
                setFormState({ ...formState, descripcion: e.target.value })
              }
            />
          </section>
          <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            type="submit"
          >
            Confirmar
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
