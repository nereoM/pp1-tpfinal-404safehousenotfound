import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error al iniciar sesión");
      }

      console.log("✅ Login exitoso:", data);
      setSuccess(true);
      // localStorage.setItem("token", data.access_token);
    } catch (err) {
      console.error(err);
      setError(err.message || "Ocurrió un error. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 flex flex-col justify-center items-center text-white px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/city-rain-dark.jpg')] bg-cover bg-center blur-sm brightness-40 z-0"></div>

      <div className="absolute left-4 bottom-2 text-xs text-gray-500 z-10">
        404 safehouse not found — Todos los derechos reservados
      </div>

      <div className="text-4xl font-bold mb-10 tracking-widest text-blue-400 z-10">
        SIGRH+
      </div>

      <form
        onSubmit={handleSubmit}
        className="z-10 bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md shadow-xl space-y-5 border border-white/20"
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

        <div className="text-sm text-center text-gray-300">
          ¿No tenés usuario?{' '}
          <a href="#" className="text-blue-400 hover:underline">
            Registrate acá
          </a>
        </div>
      </form>
    </div>
  );
}
