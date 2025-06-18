import { useState } from "react";

export default function PasoDosEncuestaManager({ formData, setFormData, onNext, onBack }) {
  const [envioATodos, setEnvioATodos] = useState(formData.envioATodos ?? true);
  const [correos, setCorreos] = useState(formData.correosAnalistas?.join(", ") || "");

  const handleOpcionCambio = (valor) => {
    setEnvioATodos(valor);
    setFormData({
      ...formData,
      envioATodos: valor,
      correosAnalistas: valor ? [] : correos.split(",").map(c => c.trim()),
    });
  };

  const handleCambioCorreos = (e) => {
    const value = e.target.value;
    setCorreos(value);
    setFormData({
      ...formData,
      correosAnalistas: value.split(",").map(c => c.trim()),
    });
  };

  const handleSiguiente = () => {
    if (!envioATodos && (!correos || correos.trim() === "")) {
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
          />
          <span className="text-base">Enviar a <strong>todos los analistas</strong></span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="envio"
            checked={!envioATodos}
            onChange={() => handleOpcionCambio(false)}
          />
          <span className="text-base">Enviar a <strong>algunos analistas</strong></span>
        </label>

        {!envioATodos && (
          <div className="pt-2">
            <label className="block mb-1 font-medium text-sm">Correos separados por coma:</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="analista1@email.com, analista2@email.com"
              rows={4}
              value={correos}
              onChange={handleCambioCorreos}
            />
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
