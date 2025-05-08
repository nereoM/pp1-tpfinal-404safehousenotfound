import { GoogleLogin } from '@react-oauth/google';
import PasswordInput from './PasswordInput';

export default function LoginForm({
  loginUsername, loginPassword,
  setLoginUsername, setLoginPassword,
  loginPasswordVisible, setLoginPasswordVisible,
  handleSubmitLogin, loginError, loadingLogin,
  setFlipped, resetLoginFields, redirect, API_URL
}) {
  return (
    <form onSubmit={handleSubmitLogin} className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full h-full shadow-xl space-y-5 border border-white/20">
      <h2 className="text-2xl font-semibold text-center text-white">Iniciar Sesión</h2>

      <input
        type="text"
        placeholder="Usuario o Email"
        value={loginUsername}
        onChange={(e) => setLoginUsername(e.target.value)}
        className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <PasswordInput
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        visible={loginPasswordVisible}
        setVisible={setLoginPasswordVisible}
        placeholder="Contraseña"
      />

      {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}

      <button type="submit" className="w-full bg-white/10 hover:bg-white/20 transition p-3 rounded text-white font-medium" disabled={loadingLogin}>
        {loadingLogin ? "Cargando..." : "Ingresar"}
      </button>

      {/* Google Login */}
      <div className="text-center">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const tokenGoogle = credentialResponse.credential;
            try {
              await fetch(`${API_URL}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ credential: tokenGoogle }),
              });

              const userRes = await fetch(`${API_URL}/auth/me`, {
                method: "GET",
                credentials: "include",
              });

              const user = await userRes.json();
              if (!userRes.ok) throw new Error(user?.error || "No se pudo obtener el usuario");

              if (redirect === "pagos") window.location.href = "/pagos";
              else if (user.roles.includes("admin")) window.location.href = "/admin/home";
              else if (user.roles.includes("rrhh")) window.location.href = "/rrhh/home";
              else if (user.roles.includes("admin-emp")) window.location.href = "/adminemp/home";
              else window.location.href = "/candidato/home";

            } catch (err) {
              console.error("Error Google login:", err);
            }
          }}
          onError={() => console.error("Falló el login con Google")}
        />
      </div>

      <div className="text-sm text-center text-gray-300">
        ¿No tenés usuario?{" "}
        <button type="button" onClick={() => { resetLoginFields(); setFlipped(true); }} className="text-indigo-400 hover:underline">
          Registrate acá
        </button>
      </div>
    </form>
  );
}
