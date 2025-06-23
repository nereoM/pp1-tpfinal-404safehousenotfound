import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DomainLogin() {
  const [empresa, setEmpresa] = useState("");
  const [error, setError]     = useState("");
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombreEmpresa = empresa.trim().toLowerCase();

    if (!nombreEmpresa) {
      setError("El nombre de empresa no puede estar vacío.");
      return;
    }

    try {
      
      const res = await fetch(
        `http://localhost:5000/auth/empresa/${encodeURIComponent(nombreEmpresa)}`,
        { method: "GET", mode: "cors" }
      );
      const data = await res.json();

      if (res.ok) {
        navigate(`/login/${encodeURIComponent(nombreEmpresa)}`);
      } else {
        setError(data.error || "Empresa no encontrada.");
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-gray-50 px-4 overflow-hidden">
      {/* decorativos */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-indigo-100 opacity-50 w-64 h-64 rounded-full" />
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 bg-indigo-100 opacity-50 w-64 h-64 rounded-full" />

      <div className="relative *:flex-1 flex flex-col sm:flex-row bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full">
        <div className="p-8">
          <div className="mb-6 text-center">
            <img src="/icono.webp" alt="SIGRH+" className="mx-auto h-19" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
            Accede a tu portal de empresa
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Escribe el dominio de tu empresa para empezar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
              dominio
            </label>
            <div className="flex rounded-md overflow-hidden border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <input
                id="domain"
                type="text"
                value={empresa}
                onChange={(e) => {
                  setEmpresa(e.target.value);
                  setError("");
                }}
                placeholder="nombre-empresa"
                className="flex-1 px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <span className="px-4 py-2 bg-gray-100 text-gray-500 select-none">
                .sighrplus.com
              </span>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
            >
              Continuar
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            ¿No recuerdas tu dominio?{" "}
            <button
              onClick={() => navigate("/soporte/dominio")}
              className="text-indigo-600 hover:underline"
            >
              Solicítalo aquí
            </button>
          </p>
        </div>

        <div className="">
          <img
            src="/mapamundisigrh.webp"
            alt="Mapa mundial de conexiones SIGRH+"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
