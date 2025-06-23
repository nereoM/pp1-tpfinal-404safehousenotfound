import { GoogleLogin } from "@react-oauth/google";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;           

const DEFAULT_COMPANY = {
  nombre:    "SIGRH+",
  icon_url:  "https://i.postimg.cc/QCBcmcym/iconoblack.png",
  image_url: "/mapamundisigrh.webp",
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
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(
          `${API_URL}/auth/empresa/${encodeURIComponent(nombre_empresa)}`,
          { method: "GET", credentials: "include" }
        );
        const data = await res.json();
        console.log({data});
        
        if (res.ok) {
          setCompany({
            nombre:    data.nombre || DEFAULT_COMPANY.nombre,
            icon_url:  data.icon_url || DEFAULT_COMPANY.icon_url,
            image_url: data.image_url || DEFAULT_COMPANY.image_url,
          });
        }
      } catch {
        setCompany(DEFAULT_COMPANY);
      }
    };
    fetchCompany();
  }, [nombre_empresa]);

  // Nuevo handleSubmit asíncrono
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  if (!identifier || !password) {
    setError("Por favor, completa usuario y contraseña.");
    return;
  }
  setLoading(true);

  try {
    // Llamo al endpoint 'login por empresa'
    const res = await fetch(
      `${API_URL}/auth/login/${encodeURIComponent(nombre_empresa)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: identifier, password })
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

    // Si el login es exitoso, pido /auth/me para sacar roles
    const userRes = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    const user = await userRes.json();
    if (!userRes.ok) throw new Error(user.error || "No se pudo obtener el usuario");

    localStorage.setItem("rol", user.roles[0]);

    // Redirección según rol (igual que antes)
    if (user.roles.includes("admin-404")) {
      navigate("/admin/home");
    } else if (user.roles.includes("reclutador")) {
      navigate("/reclutador/home");
    } else if (user.roles.includes("manager")) {
      navigate("/manager/home");
    } else if (user.roles.includes("admin-emp")) {
      navigate("/adminemp/home");
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
      <div className="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full">
        {/*formulario */}
        <div className="w-1/2 p-8">
          <CompanyHeader name={company.nombre} iconUrl={company.icon_url} />

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
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-indigo-500"
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
                placeholder="contraseña"
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-gray-800 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full py-2 mt-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
              disabled={loading}
            >
              {loading ? "Cargando..." : "Entrar"}
            </button>

            <p className="mt-4 text-center text-sm text-gray-600">
              ¿Has olvidado tu contraseña?
            </p>

            {/* Google Login */}
            <div className="mt-6 text-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    const tokenGoogle = credentialResponse.credential;
                    await fetch(`${API_URL}/auth/google`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ credential: tokenGoogle })
                    });
                    const userRes = await fetch(`${API_URL}/auth/me`, {
                      method: "GET",
                      credentials: "include",
                    });
                    const user = await userRes.json();
                    if (!userRes.ok) throw new Error(user.error);
                    localStorage.setItem("rol", user.roles[0]);
                    // Redirigir igual que arriba
                    if (user.roles.includes("admin-404")) {
                      navigate("/admin/home");
                    } else if (user.roles.includes("reclutador")) {
                      navigate("/reclutador/home");
                    } else if (user.roles.includes("manager")) {
                      navigate("/manager/home");
                    } else if (user.roles.includes("admin-emp")) {
                      navigate("/adminemp/home");
                    } else {
                      navigate("/candidato/home");
                    }
                  } catch (err) {
                    console.error("Google login error:", err);
                  }
                }}
                onError={() => console.error("Falló el login con Google")}
              />
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

        {/*DERECHAD*/}
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
