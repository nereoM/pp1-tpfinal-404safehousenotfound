import { useState } from "react";

export default function Pagos() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [username, setUsername] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardType, setCardType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/api/registrar-empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username,
          card_name: cardName,
          card_number: cardNumber,
          card_cvv: cardCVV,
          card_type: cardType,
          company_name: companyName
        }),
      });
    
      const data = await res.json();
    
      if (!res.ok) {
        console.error("Respuesta del servidor:", data); // 🔥🔥🔥
        throw new Error(data?.error || "Error desconocido en registro de empresa.");
      }
    
      setSuccess("¡Suscripción completada con éxito!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }    

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-indigo-700">
            Suscribite a SIGRH+
          </h1>
          <p className="text-gray-600 text-lg">
            Simplificá la gestión de talento en tu empresa. Administrá postulaciones, evaluaciones y desempeños de forma ágil y profesional.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Planes flexibles</li>
            <li>Gestión integral de RRHH</li>
            <li>Acceso inmediato y soporte 24/7</li>
          </ul>
          <img
            src="/public/imagen_para_pagos.png"
            className="rounded-xl shadow-lg"
          />
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-2xl space-y-6">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 text-center">
            Datos de suscripción
          </h2>

          {error && <p className="text-red-500 text-center">{error}</p>}
          {success && <p className="text-green-500 text-center">{success}</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <input
                type="text"
                placeholder="Nombre en la tarjeta"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <input
              type="text"
              placeholder="Empresa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Número de tarjeta"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <input
                type="text"
                placeholder="Código de seguridad (CVV)"
                value={cardCVV}
                onChange={(e) => setCardCVV(e.target.value)}
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <input
              type="text"
              placeholder="Tipo de tarjeta (Visa, Master, etc.)"
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="w-full border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                "Confirmar y suscribirme"
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
