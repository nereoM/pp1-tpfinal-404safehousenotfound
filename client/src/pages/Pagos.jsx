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

  // Expresión regular para caracteres válidos (solo letras y números)
  const validCharacters = /^[a-zA-Z0-9 ]+$/;

  // Función para validar que los campos no contengan caracteres especiales
  const validarCampo = (campo) => {
    if (!validCharacters.test(campo)) {
      return "Ningún campo debe contener caracteres especiales.";
    }
    return null;
  };

  const validarCampos = () => {
    // Validación de número de tarjeta (entre 13 y 19 dígitos numéricos)
    const cardRegex = /^\d{13,19}$/;
    // Validación de CVV (3 dígitos)
    const cvvRegex = /^\d{3}$/;
    // Tipos de tarjeta válidos (puedes agregar más tipos según sea necesario)
    const tiposValidos = ["visa", "mastercard", "amex", "naranja", "cabal"];

    // Validar campos sin caracteres especiales
    const errorUsername = validarCampo(username);
    if (errorUsername) return errorUsername;
    const errorCardName = validarCampo(cardName);
    if (errorCardName) return errorCardName;
    const errorCompanyName = validarCampo(companyName);
    if (errorCompanyName) return errorCompanyName;

    if (!cardRegex.test(cardNumber)) return "Número de tarjeta inválido.";
    if (!cvvRegex.test(cardCVV)) return "El CVV debe tener 3 dígitos.";
    if (!tiposValidos.includes(cardType.trim().toLowerCase())) {
      return "Tipo de tarjeta no válido. Ej: Visa, Mastercard...";
    }

    // Validación de campos vacíos
    if (!username || !cardName || !companyName) {
      return "Todos los campos son obligatorios.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const errorValidacion = validarCampos();
    if (errorValidacion) {
      setLoading(false);
      setError(errorValidacion);
      return;
    }

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
        console.error("Respuesta del servidor:", data);
        throw new Error(data?.error || "Error desconocido en registro de empresa.");
      }

      setSuccess("¡Suscripción completada con éxito!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans flex flex-col items-center justify-center px-6 py-12">
      
      {/*Botón de retroceso */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 md:top-8 md:left-8 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition"
        aria-label="Volver"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

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
