import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect");
  const form = params.get("form");

  const API_URL = import.meta.env.VITE_API_URL;
  const [flipped, setFlipped] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Agregamos esto afuera de cualquier función
  useEffect(() => {
    if (form === "register") {
      setFlipped(true);
    }
  }, [form]);


  // Estados para Login
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Estados para Registro
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRepeatPassword, setRegisterRepeatPassword] = useState("");
  const [registerPasswordVisible, setRegisterPasswordVisible] = useState(false);
  const [registerRepeatPasswordVisible, setRegisterRepeatPasswordVisible] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const frase = "Tu equipo, tu mayor valor.";
  

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess(false);

    

    if (registerPassword !== registerRepeatPassword) {
      setRegisterError("Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: registerUsername, email: registerEmail, password: registerPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al registrarse");

      setRegisterSuccess(true);
    } catch (err) {
      setRegisterError(err.message || "Ocurrió un error. Intentá nuevamente.");
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
  
    if (!loginUsername || !loginPassword) {
      setLoginError("Usuario/email y contraseña requeridos");
      return;
    }
  
    setLoginError("");
    setLoginSuccess(false);
  
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
  
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === "Por favor, verifica tu correo electrónico antes de iniciar sesión.") {
          setLoginError(data.error);
          return;
        }
        throw new Error(data?.error || "Error al iniciar sesión");
      }
  
      // 🔥 Apenas loguea, si hay redirect, mandalo a pagos
      if (redirect === "pagos") {
        navigate("/pagos");
        return;
      }
  
      // Si no hay redirect, recién ahí sigue como siempre
      const userRes = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
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
      setLoginError(err.message || "Ocurrió un error. Intentá nuevamente.");
    }
  };
  
  

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white px-4 relative">
      {/* Botón Volver */}
      <button onClick={() => navigate("/")} className="absolute top-4 left-4 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Fondo */}
      <div className="absolute inset-0 bg-[url('/city.jpg')] bg-cover bg-center blur-sm brightness-40 z-0"></div>

      {/* Botón Sobre Nosotros */}
      <button onClick={() => setShowInfo(true)} className="absolute bottom-2 right-4 text-xs text-gray-400 hover:text-white z-20">
        Sobre nosotros
      </button>

      {/* Modal Sobre Nosotros */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-2">Sobre SIGRH+</h2>
            <p className="text-sm mb-4">
              SIGRH+ es un sistema de gestión de recursos humanos desarrollado por 404 Safehouse Not Found. Nuestro objetivo es facilitar la organización del talento humano con tecnología accesible, potente y enfocada en las personas.
            </p>
            <button onClick={() => setShowInfo(false)} className="text-blue-600 hover:underline text-sm">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="text-center mb-6 z-10">
        <h1 className="text-4xl font-bold tracking-widest text-blue-400">SIGRH+</h1>
        <p className="text-sm italic text-gray-300 mt-2">{frase}</p>
      </div>

      {/* Formulario Login/Registro */}
      <div className="relative w-full max-w-md h-[600px] z-10">
        <div className={`w-full h-full relative transition-transform duration-700 ${flipped ? "rotate-y-180" : ""}`} style={{ transformStyle: "preserve-3d" }}>
          {/* Formulario Login */}
          <div className="absolute w-full h-full backface-hidden z-20">
            <form onSubmit={handleSubmitLogin} className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full h-full shadow-xl space-y-5 border border-white/20">
              <h2 className="text-2xl font-semibold text-center text-white">Iniciar Sesión</h2>
              {/* Inputs */}
              <input type="text" placeholder="Usuario o Email" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="relative">
                <input type={loginPasswordVisible ? "text" : "password"} placeholder="Contraseña" value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span onClick={() => setLoginPasswordVisible(!loginPasswordVisible)}
                  className="absolute right-3 top-3 cursor-pointer text-gray-300 hover:text-gray-100">
                  {loginPasswordVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </span>
              </div>

              {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}

              <button type="submit" className="w-full bg-white/10 hover:bg-white/20 transition p-3 rounded text-white font-medium">
                Ingresar
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
        body: JSON.stringify({ credential: tokenGoogle })
      });

      const userRes = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      const user = await userRes.json();

      if (!userRes.ok) throw new Error(user?.error || "No se pudo obtener el usuario");

      // 🔥 chequeamos redirect igual que en handleSubmitLogin 🔥
      if (redirect === "pagos") {
        navigate("/pagos");
        return;
      }

      if (user.roles.includes("admin")) {
        navigate("/admin/home");
      } else if (user.roles.includes("rrhh")) {
        navigate("/rrhh/home");
      } else {
        navigate("/candidato/home");
      }

    } catch (err) {
      console.error("Error Google login:", err);
    }
  }}
  onError={() => console.error("Falló el login con Google")}
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

          {/* Formulario Registro */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180">
            <form onSubmit={handleSubmitRegister} className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full h-full shadow-xl space-y-5 border border-white/20">
              <h2 className="text-2xl font-semibold text-center text-white">Registrarse</h2>
              {/* Inputs */}
              <input type="text" placeholder="Nombre de usuario" value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email" value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="relative">
                <input type={registerPasswordVisible ? "text" : "password"} placeholder="Contraseña" value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span onClick={() => setRegisterPasswordVisible(!registerPasswordVisible)}
                  className="absolute right-3 top-3 cursor-pointer text-gray-300 hover:text-gray-100">
                  {registerPasswordVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </span>
              </div>
              <div className="relative">
                <input type={registerRepeatPasswordVisible ? "text" : "password"} placeholder="Repetir Contraseña" value={registerRepeatPassword}
                  onChange={(e) => setRegisterRepeatPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span onClick={() => setRegisterRepeatPasswordVisible(!registerRepeatPasswordVisible)}
                  className="absolute right-3 top-3 cursor-pointer text-gray-300 hover:text-gray-100">
                  {registerRepeatPasswordVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </span>
              </div>

              {registerError && <p className="text-red-500 text-sm text-center">{registerError}</p>}

              <button type="submit" className="w-full bg-white/10 hover:bg-white/20 transition p-3 rounded text-white font-medium">
                Registrarse
              </button>

              <div className="text-sm text-center text-gray-300">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => setFlipped(false)} className="text-blue-400 hover:underline">
                  Inicia sesión acá
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
