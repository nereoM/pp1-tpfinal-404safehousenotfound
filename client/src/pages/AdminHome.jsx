import { useState, useEffect } from "react";
import { User, Settings, FileText, UserPlus, LogOut, List, BarChart2 } from "lucide-react";

export default function AdminHome() {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    method: "GET",
                    credentials: "include"
                });

                if (!res.ok) {
                    throw new Error("No se pudo obtener los datos del administrador");
                }

                const data = await res.json();
                setAdmin(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [API_URL]);

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
                <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 text-center">Menú de Administrador</h1>
                <p className="text-gray-700 text-base sm:text-lg text-center">
                    Bienvenido, {admin?.nombre}. Este panel te permite gestionar todo lo relacionado con el sistema.
                </p>

                {/* Información del administrador */}
                <div className="text-sm sm:text-base space-y-2">
                    <p className="text-gray-700">Correo: {admin?.correo}</p>
                </div>

                {/* Opciones */}
                <div className="grid grid-cols-1 gap-4 w-full">
                    {/* Ver perfil */}
                    <div className="flex items-center gap-4 p-4 bg-teal-100 rounded-lg shadow-md cursor-pointer hover:bg-teal-200 transition w-full">
                        <User className="text-teal-600 w-6 h-6" />
                        <span className="text-gray-800 text-base sm:text-lg">Ver perfil</span>
                    </div>

                    {/* Ver dashboard */}
                    <div className="flex items-center gap-4 p-4 bg-yellow-100 rounded-lg shadow-md cursor-pointer hover:bg-yellow-200 transition w-full">
                        <BarChart2 className="text-yellow-600 w-6 h-6" />
                        <span className="text-gray-800 text-base sm:text-lg">Ver dashboard</span>
                    </div>

                    {/* Gestionar usuarios y roles */}
                    <div className="flex items-center gap-4 p-4 bg-purple-100 rounded-lg shadow-md cursor-pointer hover:bg-purple-200 transition w-full">
                        <UserPlus className="text-purple-600 w-6 h-6" />
                        <span className="text-gray-800 text-base sm:text-lg">Gestionar usuarios y roles</span>
                    </div>

                    {/* Ver listado de campañas */}
                    <div className="flex items-center gap-4 p-4 bg-blue-100 rounded-lg shadow-md cursor-pointer hover:bg-blue-200 transition w-full">
                        <List className="text-blue-600 w-6 h-6" />
                        <span className="text-gray-800 text-base sm:text-lg">Ver listado de campañas</span>
                    </div>

                    {/* Generar reporte */}
                    <div className="flex items-center gap-4 p-4 bg-green-100 rounded-lg shadow-md cursor-pointer hover:bg-green-200 transition w-full">
                        <FileText className="text-green-600 w-6 h-6" />
                        <span className="text-gray-800 text-base sm:text-lg">Generar reporte</span>
                    </div>

                    {/* Cerrar sesión */}
                    <div className="flex items-center gap-4 p-4 bg-red-100 rounded-lg shadow-md cursor-pointer hover:bg-red-200 transition w-full">
                        <LogOut className="text-red-600 w-6 h-6" />
                        <span className="text-gray-800 text-base sm:text-lg">Cerrar sesión</span>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Accede a las opciones exclusivas para administrar y configurar el sistema de manera efectiva.
                </p>
            </div>
        </div>
    );
}
