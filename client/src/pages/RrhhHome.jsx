import { useEffect, useState } from "react";
import { User, ClipboardList, Settings } from "lucide-react";

export default function RrhhHome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-700">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Bienvenido, {user?.nombre}</h1>
        
        {/* Texto adicional */}
        <p className="text-gray-700 text-lg mb-4">
          Este es tu panel de administración. Aquí podrás acceder a todas las herramientas necesarias para gestionar los procesos de RRHH.
        </p>

        {/* Información del usuario */}
        <div className="space-y-4">
          <p className="text-gray-700 text-sm">Correo: {user?.correo}</p>
          <p className="text-gray-700 text-sm">Rol: {user?.roles?.[0]?.nombre || "No asignado"}</p>
        </div>

        {/* Opciones de navegación */}
        <div className="space-y-4">
          {/* Empleados */}
          <div className="flex items-center justify-between p-4 bg-blue-100 rounded-lg shadow-md cursor-pointer hover:bg-blue-200 transition-colors">
            <User className="text-blue-600 w-6 h-6" />
            <p className="text-gray-800 text-lg">Empleados</p>
          </div>

          {/* Vacantes */}
          <div className="flex items-center justify-between p-4 bg-green-100 rounded-lg shadow-md cursor-pointer hover:bg-green-200 transition-colors">
            <ClipboardList className="text-green-600 w-6 h-6" />
            <p className="text-gray-800 text-lg">Vacantes</p>
          </div>

          {/* Ajustes */}
          <div className="flex items-center justify-between p-4 bg-yellow-100 rounded-lg shadow-md cursor-pointer hover:bg-yellow-200 transition-colors">
            <Settings className="text-yellow-600 w-6 h-6" />
            <p className="text-gray-800 text-lg">Ajustes</p>
          </div>
        </div>

        <div className="text-sm text-gray-500 mt-4">
          <p>Accede a todas las funciones exclusivas de RRHH para administrar el talento de la empresa.</p>
        </div>
      </div>
    </div>
  );
}
