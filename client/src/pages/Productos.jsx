import { useNavigate } from "react-router-dom";
import { UserCheck, BarChart2, TrendingUp, FileText } from "lucide-react"; // Importamos íconos de lucide-react

export default function Productos() {
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
                <h1 className="text-4xl font-bold mb-10 text-indigo-700 text-center">Nuestros Productos</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Producto 1 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-center">
                        <UserCheck className="text-indigo-600 h-16 w-16 mb-4 mx-auto transition-all duration-300 transform hover:scale-110" />
                        <h3 className="text-xl font-semibold text-indigo-600">Gestión de Reclutamiento</h3>
                        <p className="text-gray-600">
                            Evaluación automatizada de CVs con etiquetas configurables. Detectá candidatos aptos y accedé a sus datos esenciales al instante.
                        </p>
                    </div>

                    {/* Producto 2 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-center">
                        <BarChart2 className="text-indigo-600 h-16 w-16 mb-4 mx-auto transition-all duration-300 transform hover:scale-110" />
                        <h3 className="text-xl font-semibold text-indigo-600">Gestión de Desempeño</h3>
                        <p className="text-gray-600">
                            Modelos predictivos para estimar el rendimiento futuro de empleados a partir de datos históricos y patrones clave.
                        </p>
                    </div>

                    {/* Producto 3 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-center">
                        <TrendingUp className="text-indigo-600 h-16 w-16 mb-4 mx-auto transition-all duration-300 transform hover:scale-110" />
                        <h3 className="text-xl font-semibold text-indigo-600">Análisis de Rotación</h3>
                        <p className="text-gray-600">
                            Identificá señales tempranas de baja de personal. Actuá a tiempo con información clara y patrones de comportamiento detectados por IA.
                        </p>
                    </div>

                    {/* Producto 4 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-center">
                        <FileText className="text-indigo-600 h-16 w-16 mb-4 mx-auto transition-all duration-300 transform hover:scale-110" />
                        <h3 className="text-xl font-semibold text-indigo-600">Reportería y Analítica</h3>
                        <p className="text-gray-600">
                            Dashboards interactivos, métricas clave y filtros dinámicos. Tomá decisiones basadas en datos reales y visualizaciones intuitivas.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
