import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, List, PlusCircle, BarChart2, FileText, LogOut } from "lucide-react";

export default function RrhhHome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include"
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
        credentials: "include"
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
      <div className="h-screen w-full flex items-center justify-center bg-blue-50">
        <div className={`text-lg ${error ? "text-red-500" : "text-gray-700"}`}>
          {error || "Cargando..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 sm:p-8 md:p-10 space-y-6 overflow-y-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 text-center">Bienvenido, {user?.nombre}</h1>
        <p className="text-gray-700 text-base sm:text-lg text-center">
          Este es tu panel de administración. Aquí podrás acceder a todas las herramientas necesarias para gestionar los procesos de RRHH.
        </p>

        {/* Información del usuario */}
        <div className="space-y-4">
          <p className="text-gray-700 text-sm">Correo: {user?.correo}</p>
        </div>

        {/* Opciones de navegación */}
        <div className="grid grid-cols-1 gap-4 w-full mt-6">
          {/* Ver perfil */}
          <div className="flex items-center gap-4 p-4 bg-teal-100 rounded-lg shadow-md cursor-pointer hover:bg-teal-200 transition w-full">
            <User className="text-teal-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">Ver perfil</span>
          </div>

          {/* Ver listado de ofertas */}
          <div className="flex items-center gap-4 p-4 bg-yellow-100 rounded-lg shadow-md cursor-pointer hover:bg-yellow-200 transition w-full">
            <List className="text-yellow-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">Ver listado de ofertas</span>
          </div>

          {/* Publicar una nueva oferta */}
          <div className="flex items-center gap-4 p-4 bg-blue-100 rounded-lg shadow-md cursor-pointer hover:bg-blue-200 transition w-full">
            <PlusCircle className="text-blue-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">Publicar una nueva oferta</span>
          </div>

          {/* Ver dashboard */}
          <div className="flex items-center gap-4 p-4 bg-purple-100 rounded-lg shadow-md cursor-pointer hover:bg-purple-200 transition w-full">
            <BarChart2 className="text-purple-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">Ver dashboard</span>
          </div>

          {/* Generar reporte */}
          <div className="flex items-center gap-4 p-4 bg-teal-100 rounded-lg shadow-md cursor-pointer hover:bg-teal-200 transition w-full">
            <FileText className="text-teal-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">Generar reporte</span>
          </div>

          {/* Cerrar sesión */}
          <div
            onClick={handleLogout}
            className="flex items-center gap-4 p-4 bg-red-100 rounded-lg shadow-md cursor-pointer hover:bg-red-200 transition w-full"
          >
            <LogOut className="text-red-600 w-6 h-6" />
            <span className="text-gray-800 text-base sm:text-lg">Cerrar sesión</span>
          </div>
        </div>

        <div className="text-sm text-gray-500 mt-4 text-center">
          <p>Accede a todas las funciones exclusivas para administrar el talento y las ofertas laborales en la empresa.</p>
        </div>
      </div>
    </div>
  );
}
