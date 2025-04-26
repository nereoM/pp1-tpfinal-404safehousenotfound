import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, List, FileText, UserPlus } from "lucide-react";

export default function CandidatoHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("No se pudo obtener los datos del usuario");
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [API_URL]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        navigate("/login");
      } else {
        const errorData = await res.json();
        console.error("Error en el logout:", errorData);
        alert("Error al cerrar sesión");
      }
    } catch (err) {
      console.error("Error en el fetch:", err);
      alert("Error al cerrar sesión");
    }
  };

  if (loading || error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-blue-600">
        <div className={`text-lg ${error ? "text-red-500" : "text-white"}`}>
          {error || "Cargando..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 sm:p-8 md:p-10 space-y-6 overflow-y-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 text-center">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="text-gray-700 text-base sm:text-lg text-center">
          ¡Gracias por formar parte de nuestro equipo!
        </p>

        {/* Información del usuario */}
        <div className="text-sm sm:text-base space-y-2">
          <p className="text-gray-700">Correo: {user?.correo}</p>
        </div>

        {/* Opciones de navegación */}
        <div className="grid grid-cols-1 gap-4 w-full mt-6">
          {/* Ver perfil */}
          <div className="flex items-center gap-4 p-4 bg-teal-100 rounded-lg shadow-md cursor-pointer hover:bg-teal-200 transition w-full">
            <User className="text-teal-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">
              Ver perfil
            </span>
          </div>

          {/* Cargar CV */}
          <div className="flex items-center gap-4 p-4 bg-blue-100 rounded-lg shadow-md cursor-pointer hover:bg-blue-200 transition w-full">
            <FileText className="text-blue-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">
              Cargar CV
            </span>
          </div>

          {/* Ver listado de ofertas */}
          <div className="flex items-center gap-4 p-4 bg-yellow-100 rounded-lg shadow-md cursor-pointer hover:bg-yellow-200 transition w-full">
            <List className="text-yellow-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">
              Ver Listado de Ofertas
            </span>
          </div>

          {/* Ver mis postulaciones */}
          <div className="flex items-center gap-4 p-4 bg-purple-100 rounded-lg shadow-md cursor-pointer hover:bg-purple-200 transition w-full">
            <UserPlus className="text-purple-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">
              Ver Mis Postulaciones
            </span>
          </div>

          {/* Suscribirse*/}
          <div
            onClick={() => navigate("/pagos")}
            className="flex items-center gap-4 p-4 bg-indigo-100 rounded-lg shadow-md cursor-pointer hover:bg-indigo-200 transition w-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21v-2a4 4 0 014-4h10a4 4 0 014 4v2M16 3H8a2 2 0 00-2 2v4h12V5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 12h.01"
              />
            </svg>
            <span className="text-gray-800 text-base sm:text-lg">
              ¿Tenés una empresa? Suscribite y accede a todos nuestros beneficios
            </span>
          </div>

          {/* Cerrar sesión */}
          <div
            onClick={handleLogout}
            className="flex items-center gap-4 p-4 bg-red-100 rounded-lg shadow-md cursor-pointer hover:bg-red-200 transition w-full"
          >
            <LogOut className="text-red-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">
              Cerrar Sesión
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Accede a todas las funciones exclusivas para gestionar tu perfil y explorar nuevas oportunidades laborales.
        </p>
      </div>
    </div>
  );
}
