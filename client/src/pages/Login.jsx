import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [flipped, setFlipped] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [acceptNotifications, setAcceptNotifications] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const frase = "Tu equipo, tu mayor valor.";

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Error al registrarse");

      setSuccess(true);
      setFlipped(false);
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Error al iniciar sesión");

      const userRes = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include"
      });

      const user = await userRes.json();
      if (!userRes.ok) throw new Error(user?.error || "No se pudo obtener el usuario");

      if (user.roles.includes("admin")) {
        navigate("/admin/home");
      } else if (user.roles.includes("rrhh")) {
        navigate("/rrhh/home");
      } else {
        navigate("/candidato/home");
      }
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white px-4 relative">
      <div className="absolute inset-0 bg-[url('/city.jpg')] bg-cover bg-center blur-sm brightness-40 z-0"></div>

      <button
        onClick={() => setShowInfo(true)}
        className="absolute bottom-2 right-4 text-xs text-gray-400 hover:text-white z-20"
      >
        Sobre nosotros
      </button>

      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-2">Sobre SIGRH+</h2>
            <p className="text-sm mb-4">
              SIGRH+ es un sistema de gestión de recursos humanos desarrollado por 404 Safehouse Not Found. Nuestro objetivo es facilitar la organización del talento humano con tecnología accesible, potente y enfocada en las personas.
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="text-blue-600 hover:underline text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="absolute left-4 bottom-2 text-xs text-gray-500 z-10">
        404 safehouse not found — Todos los derechos reservados
      </div>

      <div className="text-center mb-6 z-10">
        <h1 className="text-4xl font-bold tracking-widest text-blue-400">
          SIGRH+
        </h1>
        <p className="text-sm italic text-gray-300 mt-2">{frase}</p>
      </div>

      <div className="relative w-full max-w-md h-[600px] z-10">
        <div
          className={`w-full h-full relative transition-transform duration-700 ${flipped ? "rotate-y-180" : ""}`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Login */}
          <div className="absolute w-full h-full backface-hidden z-20">
            <form
              onSubmit={handleSubmitLogin}
              className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full h-full shadow-xl space-y-5 border border-white/20"
            >
              <h2 className="text-2xl font-semibold text-center text-white">Iniciar Sesión</h2>

              <input
                type="text"
                placeholder="Usuario o Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer text-gray-300 hover:text-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </span>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {success && <p className="text-green-400 text-sm text-center">Inicio de sesión exitoso 🎉</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white/10 hover:bg-white/20 transition p-3 rounded text-white font-medium disabled:opacity-60"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

              <div className="text-center">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    const tokenGoogle = credentialResponse.credential;

                    fetch(`${API_URL}/auth/google`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ credential: tokenGoogle })
                    })
                    .then(res => res.json())
                    .then(data => {
                      console.log("Login Google exitoso:", data);
                    })
                    .catch(err => console.error("Error Google login:", err));
                  }}
                  onError={() => {
                    console.error("Falló el login con Google");
                  }}
                />
              </div>

              <div className="text-sm text-center text-gray-300">
                ¿No tenés usuario?{' '}
                <button type="button" onClick={() => setFlipped(true)} className="text-blue-400 hover:underline">
                  Registrate acá
                </button>
              </div>
            </form>
          </div>

          {/* Registro */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180">
            <form
              onSubmit={handleSubmitRegister}
              className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full h-full shadow-xl border border-white/20 space-y-4"
            >
              <h2 className="text-2xl font-semibold text-center text-white">Registrarse</h2>

              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="password"
                placeholder="Repetir contraseña"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={acceptNotifications}
                  onChange={(e) => setAcceptNotifications(e.target.checked)}
                />
                <span>Deseo recibir notificaciones</span>
              </label>

              <button
                type="submit"
                className="w-full bg-white/10 hover:bg-white/20 transition p-3 rounded text-white font-medium"
              >
                Registrarse
              </button>

              <div className="text-sm text-center text-gray-300">
                ¿Ya tenés cuenta?{' '}
                <button type="button" onClick={() => setFlipped(false)} className="text-blue-400 hover:underline">
                  Iniciar sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
