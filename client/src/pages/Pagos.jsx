import { useState } from "react";

export default function Pagos() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [username, setUsername]     = useState("");
  const [cardName, setCardName]     = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardCVV, setCardCVV]       = useState("");
  const [cardType, setCardType]     = useState("");
  const [companyName, setCompanyName] = useState("");
  const [iconFile, setIconFile]     = useState(null);      // <— nuevo
  const [coverFile, setCoverFile]   = useState(null);      // <— nuevo

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const validCharacters = /^[a-zA-Z0-9 ]+$/;
  const validarCampo = (campo) => {
    if (!validCharacters.test(campo)) {
      return "Ningún campo debe contener caracteres especiales.";
    }
    return null;
  };

  const validarCampos = () => {
    const cardRegex = /^\d{13,19}$/;
    const cvvRegex  = /^\d{3}$/;
    const tiposValidos = ["visa", "mastercard", "amex", "naranja", "cabal"];

    if (!username || !cardName || !companyName)
      return "Todos los campos son obligatorios.";

    const e1 = validarCampo(username);
    if (e1) return e1;
    const e2 = validarCampo(cardName);
    if (e2) return e2;
    const e3 = validarCampo(companyName);
    if (e3) return e3;

    if (!cardRegex.test(cardNumber)) return "Número de tarjeta inválido.";
    if (!cvvRegex.test(cardCVV))       return "El CVV debe tener 3 dígitos.";
    if (!tiposValidos.includes(cardType.trim().toLowerCase()))
      return "Tipo de tarjeta no válido. Ej: Visa, Mastercard...";

    // validamos que hayan seleccionado archivos
    if (!iconFile || !coverFile)
      return "Debes seleccionar un ícono y una imagen de portada.";

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
      // 1) Registro JSON
      const res = await fetch(`${API_URL}/api/registrar-empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          card_name:   cardName,
          card_number: cardNumber,
          card_cvv:    cardCVV,
          card_type:   cardType,
          company_name: companyName
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Registro fallido:", data);
        throw new Error(data?.error || "Error desconocido en registro de empresa.");
      }

      // 2) Subida de ícono + portada
      const formData = new FormData();
      formData.append("icono",   iconFile);
      formData.append("portada", coverFile);

      const up = await fetch(
        `${API_URL}/auth/empresa/${encodeURIComponent(companyName)}/preferencias/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData
        }
      );
      const upData = await up.json();
      if (!up.ok) {
        console.error("Upload fallido:", upData);
        throw new Error(upData?.error || "Error al subir archivos.");
      }

      setSuccess("¡Suscripción y subida de archivos completada con éxito!");
      // opcional: reset de campos
      setUsername(""); setCardName(""); setCardNumber("");
      setCardCVV(""); setCardType(""); setCompanyName("");
      setIconFile(null); setCoverFile(null);

    } catch (err) {
      console.error(err);
      setError(err.message || "Error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-800 font-sans flex flex-col items-center justify-center px-6 py-12">
      {/* Botón de retroceso */}
      <button
        onClick={() => (window.location.href = "/login")}
        className="absolute top-4 left-4 md:top-8 md:left-8 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition"
        aria-label="Volver"
      >
        ←
      </button>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* IZQUIERDA */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-indigo-700">Suscribite a SIGRH+</h1>
          <p className="text-gray-600 text-lg">
            Simplificá la gestión de talento en tu empresa. Administrá postulaciones, evaluaciones y desempeños de forma ágil y profesional.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Planes flexibles</li>
            <li>Gestión integral de RRHH</li>
            <li>Acceso inmediato y soporte 24/7</li>
          </ul>
          <img
            src="/mapamundisigrh.png"
            alt="Portada SIGRH+"
            className="rounded-xl shadow-lg w-full"
          />
        </div>

        {/* DERECHA: FORMULARIO */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl space-y-6">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 text-center">
            Datos de suscripción
          </h2>

          {error   && <p className="text-red-500 text-center">{error}</p>}
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

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ícono de empresa
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIconFile(e.target.files[0])}
                className="w-full border p-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen de portada
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files[0])}
                className="w-full border p-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
