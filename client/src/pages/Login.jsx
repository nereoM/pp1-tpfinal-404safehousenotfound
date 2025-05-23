import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect");
  const form = params.get("form");

  const API_URL = import.meta.env.VITE_API_URL;
  const [flipped, setFlipped] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);


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
  const [registerName, setRegisterName] = useState("");
  const [registerSurname, setRegisterSurname] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRepeatPassword, setRegisterRepeatPassword] = useState("");
  const [registerPasswordVisible, setRegisterPasswordVisible] = useState(false);
  const [registerRepeatPasswordVisible, setRegisterRepeatPasswordVisible] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const frase = "Tu oportunidad de crecer empieza ahora.";

  const resetLoginFields = () => {
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
    setLoginSuccess(false);
  };

  const resetRegisterFields = () => {
    setRegisterName("");
    setRegisterSurname("");
    setRegisterUsername("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterRepeatPassword("");
    setRegisterError("");
    setRegisterSuccess(false);
  };



  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setLoadingRegister(true);
    setRegisterError("");
    setRegisterSuccess(false);

    if (!registerName.trim() || !registerSurname.trim() || !registerEmail.trim() || !registerPassword.trim() || !registerRepeatPassword.trim()) {
      setRegisterError('Por favor, completá todos los campos.');
      setLoadingRegister(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setRegisterError('El correo electrónico no es válido.');
      setLoadingRegister(false);
      return;
    }

    // Validación de longitud mínima de la contraseña (8 caracteres)
    if (registerPassword.length < 8) {
      setRegisterError('La contraseña debe tener al menos 8 caracteres.');
      setLoadingRegister(false);
      return;
    }

    // Validación de mayúscula
    const upperCaseRegex = /[A-Z]/;
    if (!upperCaseRegex.test(registerPassword)) {
      setRegisterError('La contraseña debe incluir al menos una letra mayúscula.');
      setLoadingRegister(false);
      return;
    }

    // Validación de número
    const numberRegex = /\d/;
    if (!numberRegex.test(registerPassword)) {
      setRegisterError('La contraseña debe incluir al menos un número.');
      setLoadingRegister(false);
      return;
    }

    // Validación de carácter especial
    const specialCharRegex = /[^A-Za-z0-9]/;
    if (!specialCharRegex.test(registerPassword)) {
      setRegisterError('La contraseña debe incluir al menos un carácter especial.');
      setLoadingRegister(false);
      return;
    }

    if (registerPassword !== registerRepeatPassword) {
      setRegisterError("Las contraseñas no coinciden.");
      setLoadingRegister(false);
      return;
    }

    // Si pasa todas las validaciones
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          name: registerName,
          surname: registerSurname,
          username: registerEmail,
          email: registerEmail,
          password: registerPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al registrarse");

      setRegisterSuccess(true);
    } catch (err) {
      setRegisterError(err.message || "Ocurrió un error. Intentá nuevamente.");
    }

    finally {
      setLoadingRegister(false);
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setLoadingLogin(true);
    setLoginError("");
    setLoginSuccess(false);

    if (!loginUsername || !loginPassword) {
      setLoginError("Usuario/email y contraseña requeridos");
      setLoadingLogin(false);
      return;
    }

    if (loginUsername.length < 4) {
      setLoginError('El nombre de usuario debe tener al menos 4 caracteres.');
      setLoadingLogin(false);
      return;
    }

    /*
    // Validación de longitud mínima de la contraseña (8 caracteres)
    if (loginPassword.length < 8) {
      setLoginError('La contraseña debe tener al menos 8 caracteres.');
      setLoadingLogin(false);
      return;
    }
  
    // Validación de mayúscula
    const upperCaseRegex = /[A-Z]/;
    if (!upperCaseRegex.test(loginPassword)) {
      setLoginError('La contraseña debe incluir al menos una letra mayúscula.');
      setLoadingLogin(false);
      return;
    }
  
    // Validación de número
    const numberRegex = /\d/;
    if (!numberRegex.test(loginPassword)) {
      setLoginError('La contraseña debe incluir al menos un número.');
      setLoadingLogin(false);
      return;
    }
  
    // Validación de carácter especial
    const specialCharRegex = /[^A-Za-z0-9]/;
    if (!specialCharRegex.test(loginPassword)) {
      setLoginError('La contraseña debe incluir al menos un carácter especial.');
      setLoadingLogin(false);
      return;
    }
    */

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

      // Redirigir a pagos si el login es exitoso y el redirect es "pagos"
      if (redirect === "pagos") {
        navigate("/pagos");
        return;
      }

      // Verificación de roles del usuario
      const userRes = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      const user = await userRes.json();
      if (!userRes.ok) {
        setIsLoading(false);
        throw new Error(user?.error || "No se pudo obtener el usuario");
      }

      // Guarda el rol principal
      if (user.roles && user.roles.length > 0) {
        localStorage.setItem("rol", user.roles[0]);
      }

      // Redirigir según los roles del usuario
      if (user.roles.includes("admin-404")) {
        navigate("/admin/home");
      } else if (user.roles.includes("reclutador")) {
        navigate("/reclutador/home");
      } else if (user.roles.includes("manager")) {
        navigate("/manager/home");
      } else if (user.roles.includes("admin-emp")) {
        navigate("/adminemp/home");
      } else if (user.roles.includes("empleado")) {
        navigate("/empleado/home");
      } else {
        navigate("/candidato/home");
      }

    } catch (err) {
      setLoginError(err.message || "Ocurrió un error. Intentá nuevamente.");
    }

    finally {
      setLoadingLogin(false);
    }
  };

  useEffect(() => {
    const handlePopState = (e) => {
      // Evitar que el usuario navegue hacia atrás
      e.preventDefault();
      history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white px-4 relative">
      {/* Botón Volver */}
      <button onClick={() => navigate("/")} className="absolute top-4 left-4 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* fondo */}
    <div className="absolute inset-0 bg-[url('/city_blurred_4k_sunrise.webp')] bg-cover bg-center z-0"></div>

      {/* sobre nosotros */}
      <button onClick={() => setShowInfo(true)} className="absolute bottom-2 right-4 text-xs text-gray-500 hover:text-white z-20">
        Sobre nosotros
      </button>

      {/* modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-2">Sobre SIGRH+</h2>
            <p className="text-sm mb-4">
              SIGRH+ es un sistema de gestión de recursos humanos desarrollado por 404 Safehouse Not Found. Nuestro objetivo es facilitar la organización del talento humano con tecnología accesible, potente y enfocada en las personas.
            </p>
            <button onClick={() => setShowInfo(false)} className="text-indigo-600 hover:underline text-sm">
              Cerrar
            </button>
          </div>
        </div>
      )}


        <div className="text-center mb-6 z-10">
          <h1 className="text-4xl font-bold tracking-widest text-indigo-600">SIGRH+</h1>
          <p className="text-sm italic text-gray-300 mt-2">{frase}</p>
        </div>

        {/* Formulario Login/Registro */}
        <div className="relative w-full max-w-md h-screen max-h-[80vh] z-10">
          <div className={`w-full h-full relative transition-transform duration-700 ${flipped ? "rotate-y-180" : ""}`} style={{ transformStyle: "preserve-3d" }}>
            {/* Formulario Login */}
            <div className="absolute w-full h-full backface-hidden z-20">
              <form onSubmit={handleSubmitLogin} className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full h-full shadow-xl space-y-5 border border-white/20">
                <h2 className="text-2xl font-semibold text-center text-white">Iniciar Sesión</h2>

                <input type="text" placeholder="Email" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="relative">
                  <input type={loginPasswordVisible ? "text" : "password"} placeholder="Contraseña" value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-3 pr-10 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <span onClick={() => setLoginPasswordVisible(!loginPasswordVisible)}
                    className="absolute right-3 top-3 cursor-pointer text-gray-300 hover:text-gray-100">
                    {loginPasswordVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </span>
                </div>

                {loginError && <p id="login-error" className="text-red-500 text-sm text-center">{loginError}</p>}

                <button id="login-button" type="submit" className="w-full bg-white/10 hover:bg-white/20 transition p-3 rounded text-white font-medium" disabled={loadingLogin}>
                  {loadingLogin ? "Cargando..." : "Ingresar"}
                </button>

                {/* logeo google */}
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

                        if (user.roles && user.roles.length > 0) {
                          localStorage.setItem("rol", user.roles[0]);
                        }

                        if (!userRes.ok) throw new Error(user?.error || "No se pudo obtener el usuario");

                        //  chequeamos redirect 
                        if (redirect === "pagos") {
                          navigate("/pagos");
                          return;
                        }

                        if (user.roles.includes("admin-404")) {
                          navigate("/admin/home");
                        } else if (user.roles.includes("rrhh")) {
                          navigate("/reclutador/home");
                        } else if (user.roles.includes("admin-emp")) {
                          navigate("/adminemp/home"); //
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
                  <button id="toggle-to-register" type="button" onClick={() => { resetLoginFields(); setFlipped(true) }} className="text-indigo-500 hover:underline">
                    Registrate acá
                  </button>
                </div>
              </form>
            </div>

          {/* Formulario Registro */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180">
            <form onSubmit={handleSubmitRegister} className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full h-full shadow-xl space-y-5 border border-white/20">
              <h2 className="text-2xl font-semibold text-center text-white">Registrarse</h2>

              <input type="text" placeholder="Nombre" value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="text" placeholder="Apellido" value={registerSurname}
                onChange={(e) => setRegisterSurname(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="email" placeholder="Email" value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              
               {/* ==================== INPUT CONTRASEÑA ==================== */}
              <div className="relative group w-full">
                <input
                  type={registerPasswordVisible ? "text" : "password"}
                  placeholder="Contraseña"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span
                  onClick={() => setRegisterPasswordVisible(!registerPasswordVisible)}
                  className="absolute right-3 top-3 cursor-pointer text-gray-300 hover:text-gray-100"
                >
                  {registerPasswordVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </span>

                {/* Tooltip estructurado */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-72 bg-white text-black text-sm rounded p-4 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <p className="font-semibold mb-1">La contraseña debe tener:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Al menos 8 caracteres</li>
                    <li>Una letra mayúscula</li>
                    <li>Una letra minúscula</li>
                    <li>Un número</li>
                    <li>Un carácter especial</li>
                  </ul>
                </div>
              </div>

              {/* ==================== INPUT REPETIR CONTRASEÑA ==================== */}

              <div className="relative group w-full">
                <input
                  type={registerRepeatPasswordVisible ? "text" : "password"}
                  placeholder="Repetir Contraseña"
                  value={registerRepeatPassword}
                  onChange={(e) => setRegisterRepeatPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span
                  onClick={() => setRegisterRepeatPasswordVisible(!registerRepeatPasswordVisible)}
                  className="absolute right-3 top-3 cursor-pointer text-gray-300 hover:text-gray-100"
                >
                  {registerRepeatPasswordVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </span>

                {/* Tooltip estructurado */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-72 bg-white text-black text-sm rounded p-4 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <p className="font-semibold mb-1">La contraseña debe tener:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Al menos 8 caracteres</li>
                    <li>Una letra mayúscula</li>
                    <li>Una letra minúscula</li>
                    <li>Un número</li>
                    <li>Un carácter especial</li>
                  </ul>
                </div>
              </div>

              {/* Mensaje de error o éxito */}
              {registerError && <p id="register-error" className="text-red-500 text-sm text-center">{registerError}</p>}
              {registerSuccess && <p className="text-green-500 text-sm text-center">¡Registro exitoso! Verifique su email</p>}  {/* Mensaje de éxito */}

              <button id="register-button" type="submit" className="w-full bg-white/10 hover:bg-white/20 transition p-3 rounded text-white font-medium" disabled={loadingRegister}>
                {loadingRegister ? "Cargando..." : "Registrarse"}
              </button>

              <div className="text-sm text-center text-gray-300">
                ¿Ya tienes cuenta?{' '}
                <button type="button" id="toggle-to-login" onClick={() => { resetRegisterFields(); setFlipped(false); }} className="text-indigo-500 hover:underline">
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
