import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const DEFAULT_COMPANY = {
  nombre:    "SIGRH+",
  icon_url:  "/iconoblack.png",
  image_url: "/mapamundisigrh.png",
};

function CompanyHeader({ name, iconUrl }) {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <img
        src={iconUrl}
        alt={name}
        className="h-12 w-12 object-contain rounded border"
      />
      <h2 className="text-2xl font-semibold text-gray-800">{name}</h2>
    </div>
  );
}

export default function LoginEmpresa() {
  const { nombre_empresa } = useParams();
  const navigate           = useNavigate();

  const [company, setCompany]   = useState(DEFAULT_COMPANY);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/auth/empresa/${encodeURIComponent(nombre_empresa)}`,
          { method: "GET", credentials: "include" }
        );
        const data = await res.json();
        if (res.ok) {
          setCompany({
            nombre:    data.nombre || DEFAULT_COMPANY.nombre,
            icon_url:  data.icon_url || DEFAULT_COMPANY.icon_url,
            image_url: data.image_url || DEFAULT_COMPANY.image_url,
          });
        } else {
          // fallback a default
          setCompany(DEFAULT_COMPANY);
        }
      } catch {
        setCompany(DEFAULT_COMPANY);
      }
    };

    fetchCompany();
  }, [nombre_empresa]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Por favor, completa usuario y contraseña.");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
      <div className="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full">
        {/* IZQUIERDA: Formulario */}
        <div className="w-1/2 p-8">
          <CompanyHeader
            name={company.nombre}
            iconUrl={company.icon_url}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Usuario o Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="usuario@empresa.com"
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full py-2 mt-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
            >
              Entrar
            </button>

            <p className="mt-4 text-center text-sm text-gray-600">
              ¿Has olvidado tu contraseña?
            </p>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                className="w-full flex items-center justify-center border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100"
              >
                <img src="/google-icon.svg" alt="Google" className="h-5 w-5 mr-2" />
                Entrar con Google
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-center border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100"
              >
                <img src="/microsoft-icon.svg" alt="Microsoft" className="h-5 w-5 mr-2" />
                Entrar con Microsoft
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              ¿Quieres iniciar sesión en otra empresa?
            </p>
            <p className="text-center text-sm">
              <button
                onClick={() => navigate("/empresa")}
                className="text-indigo-600 hover:underline"
              >
                Cambiar empresa
              </button>
            </p>
          </form>
        </div>

        
        <div className="w-1/2">
          <img
            src={company.image_url}
            alt={`${company.nombre} portada`}
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
