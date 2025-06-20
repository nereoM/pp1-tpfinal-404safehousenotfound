import { useState } from "react";

export default function PasoDosEncuestaManager({ formData, setFormData, onNext, onBack }) {
  const [envioATodos, setEnvioATodos] = useState(formData.envioATodos ?? true);
  const [emailInput, setEmailInput] = useState("");
  const [correos, setCorreos] = useState(formData.correosAnalistas || []);

  const handleOpcionCambio = (valor) => {
    setEnvioATodos(valor);
    setFormData({
      ...formData,
      envioATodos: valor,
      correosAnalistas: valor ? [] : correos,
    });
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const nuevoCorreo = emailInput.trim();
      if (nuevoCorreo && !correos.includes(nuevoCorreo)) {
        const nuevos = [...correos, nuevoCorreo];
        setCorreos(nuevos);
        setFormData({ ...formData, correosAnalistas: nuevos });
      }
      setEmailInput("");
    }
  };

  const eliminarCorreo = (correo) => {
    const nuevos = correos.filter((c) => c !== correo);
    setCorreos(nuevos);
    setFormData({ ...formData, correosAnalistas: nuevos });
  };

  const handleSiguiente = () => {
    if (!envioATodos && correos.length === 0) {
      alert("Debes ingresar al menos un correo.");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6 text-gray-800">
      <h2 className="text-xl font-semibold">Destinatarios de la encuesta</h2>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="envio"
            checked={envioATodos}
            onChange={() => handleOpcionCambio(true)}
            className="accent-blue-600 w-5 h-5"
          />
          <span className="text-base">Enviar a <strong>todos los analistas</strong></span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="envio"
            checked={!envioATodos}
            onChange={() => handleOpcionCambio(false)}
            className="accent-blue-600 w-5 h-5"
          />
          <span className="text-base">Enviar a <strong>algunos analistas</strong></span>
        </label>

        {!envioATodos && (
          <div className="ml-6 space-y-2">
            <input
              type="text"
              placeholder="Presioná Enter para agregar"
              className="w-full border border-gray-300 rounded-md p-2"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
            />
            <div className="flex flex-wrap gap-2">
              {correos.map((correo, index) => (
                <div
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-2"
                >
                  <span>{correo}</span>
                  <button
                    onClick={() => eliminarCorreo(correo)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Atrás
        </button>
        <button
          onClick={handleSiguiente}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
