import { useNavigate } from "react-router-dom";

export default function LobbyEmp() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans flex flex-col">
            {/* Top Bar */}
            <div className="bg-indigo-700 text-white py-4 px-6 shadow-md h-full">
                <div className="max-w-7xl mx-auto flex justify-between items-center h-full">
                    <h2 className="text-lg font-medium">SIGRH+ Empresas</h2>
                    <div className="flex gap-6">
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="bg-indigo-500 px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all duration-300"
                        >
                            Iniciar sesión
                        </button>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="bg-white text-indigo-600 border border-indigo-500 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all duration-300"
                        >
                            Registrarse
                        </button>
                    </div>
                </div>
            </div>

            {/* contenido central */}
            <main className="flex flex-col items-center justify-center px-6 py-16 text-center flex-grow h-[100vh]">
                <h1 className="text-3xl font-medium mb-6 text-indigo-500 leading-tight">
                    Bienvenido de nuevo a SIGRH+ Empresas
                </h1>
                <p className="text-gray-400 max-w-2xl mb-10 text-sm">
                    Gracias por confiar en nosotros para gestionar los procesos de selección y desarrollo del talento en tu organización. 
                    ¡Estamos emocionados de seguir acompañándote en este camino de éxito y crecimiento!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="bg-indigo-500 text-white px-6 py-3 rounded-full hover:bg-indigo-600 transition-all duration-300 transform hover:scale-110"
                    >
                        Iniciar sesión
                    </button>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="bg-white text-indigo-600 border border-indigo-500 px-6 py-3 rounded-full hover:bg-indigo-100 transition-all duration-300 transform hover:scale-110"
                    >
                        Registrarse
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-indigo-700 text-white py-8 mt-16 shadow-inner">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-xs opacity-80">
                        © 2025 SIGRH+. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
