import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    //necesito logica de back
    console.log("Logueando con:", username, password);
  };

  return (
    <div className="min-h-screen bg-gray-800 flex flex-col justify-center items-center text-white relative px-4">
      <div className="absolute left-4 bottom-2 text-xs text-gray-400">
        404 safehouse not found — Todos los derechos reservados
      </div>

      <div className="text-3xl font-bold mb-8">SIGRH+</div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-md space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center">Iniciar Sesión</h2>

        <input
          type="text"
          placeholder="Usuario o Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded text-white font-medium"
        >
          Entrar
        </button>

        <div className="text-sm text-center">
          ¿No tenés usuario?{' '}
          <a href="#" className="text-blue-400 hover:underline">
            Registrate acá
          </a>
        </div>
      </form>
    </div>
  );
}