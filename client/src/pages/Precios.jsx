import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react"; // Importa el ícono que desees de lucide-react

export default function Precios() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center px-8 py-4 shadow-sm bg-white/80 backdrop-blur-sm">
                <div className="text-2xl font-bold text-indigo-600">SIGRH+</div>
                <div className="flex-1 flex justify-center">
                    <nav className="space-x-6 text-center">
                        <button onClick={() => navigate("/")} className="hover:text-indigo-500 transition-all duration-300 transform hover:scale-105">
                            Inicio
                        </button>
                        <button onClick={() => navigate("/productos")} className="hover:text-indigo-500 transition-all duration-300 transform hover:scale-105">
                            Productos
                        </button>
                        <button onClick={() => navigate("/precios")} className="hover:text-indigo-500 transition-all duration-300 transform hover:scale-105">
                            Precios
                        </button>
                        <button onClick={() => navigate("/clientes")} className="hover:text-indigo-500 transition-all duration-300 transform hover:scale-105">
                            Clientes
                        </button>
                    </nav>
                </div>
                <div>
                    <button
                        onClick={() => navigate("/login")}
                        className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105"
                    >
                        Iniciar sesión
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="px-8 py-16">
                <h1 className="text-4xl font-bold mb-6 text-indigo-700 text-center">Plan de Suscripción</h1>

                <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-center">
                    <Package className="text-indigo-600 h-16 w-16 mb-6 mx-auto transition-all duration-300 transform hover:scale-110" />
                    <h3 className="text-2xl font-semibold text-indigo-600 mb-2">Acceso Completo</h3>
                    <p className="text-gray-600 mb-4">
                        Una única suscripción que incluye todas las funcionalidades: reclutamiento, desempeño,
                        rotación, reportería y más. Ideal para organizaciones que buscan modernizar y automatizar su
                        gestión de RRHH.
                    </p>
                    <p className="text-3xl font-bold text-indigo-700 mb-6">$99 / mes</p>
                </div>
            </main>
        </div>
    );
}
