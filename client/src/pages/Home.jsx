import { useEffect, useState } from "react";

export default function CandidatoHome() {
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
                <p className="text-gray-700 text-lg">¡Gracias por formar parte de nuestro equipo!</p>

                <div className="text-gray-700 text-sm space-y-2 mt-4">
                    <p>Correo: {user?.correo}</p>
                    <p>Rol: {user?.roles?.[0]?.nombre || "No asignado"}</p>
                </div>

                {/* Opciones de navegación */}
                <div className="space-y-4 mt-6">
                    {/* Postular a Vacantes */}
                    <div className="flex items-center justify-between p-4 bg-blue-100 rounded-lg shadow-md cursor-pointer hover:bg-blue-200 transition-colors">
                        <p className="text-gray-800 text-lg">Postular a Vacantes</p>
                    </div>

                    {/* Ver Estado de Aplicaciones */}
                    <div className="flex items-center justify-between p-4 bg-green-100 rounded-lg shadow-md cursor-pointer hover:bg-green-200 transition-colors">
                        <p className="text-gray-800 text-lg">Ver Estado de Aplicaciones</p>
                    </div>

                    {/* Actualizar Perfil */}
                    <div className="flex items-center justify-between p-4 bg-yellow-100 rounded-lg shadow-md cursor-pointer hover:bg-yellow-200 transition-colors">
                        <p className="text-gray-800 text-lg">Actualizar Perfil</p>
                    </div>
                </div>

                <div className="text-sm text-gray-500 mt-4">
                    <p>Accede a todas las funciones exclusivas para gestionar tu perfil y explorar nuevas oportunidades laborales.</p>
                </div>
            </div>
        </div>
    );
}
