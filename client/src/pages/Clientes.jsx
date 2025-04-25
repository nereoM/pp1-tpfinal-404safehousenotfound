import { useNavigate } from "react-router-dom";

export default function Clientes() {
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
                    <button onClick={() => navigate("/login")} className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105">
                        Iniciar sesión
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="px-8 py-16">
                <h1 className="text-4xl font-bold mb-6 text-indigo-700 text-center">Empresas que confían en nosotros</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
                    {/* Cliente 1 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
                        <img src="/brands/nintendo.png" alt="Nintendo" className="h-10 w-32 object-contain transition-all duration-300 transform hover:scale-105" />
                        <div>
                            <h3 className="text-xl font-semibold text-indigo-600">Nintendo</h3>
                            <p className="text-gray-600 mt-2">
                                “Usamos SIGRH+ para mejorar nuestra gestión interna de recursos humanos. ¡Definitivamente ha hecho más eficientes nuestros procesos!”
                            </p>
                        </div>
                    </div>

                    {/* Cliente 2 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
                        <img src="/brands/capcom.png" alt="Capcom" className="h-10 w-32 object-contain transition-all duration-300 transform hover:scale-105" />
                        <div>
                            <h3 className="text-xl font-semibold text-indigo-600">Capcom</h3>
                            <p className="text-gray-600 mt-2">
                                “Implementamos SIGRH+ y hemos podido organizar de manera más efectiva la capacitación y desarrollo de nuestros empleados.”
                            </p>
                        </div>
                    </div>

                    {/* Cliente 3 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
                        <img src="/brands/mappa.png" alt="Mappa" className="h-10 w-32 object-contain transition-all duration-300 transform hover:scale-105" />
                        <div>
                            <h3 className="text-xl font-semibold text-indigo-600">Mappa</h3>
                            <p className="text-gray-600 mt-2">
                                “La herramienta de SIGRH+ ha sido fundamental en la gestión de nuestro equipo, facilitando todo desde la selección hasta el bienestar de nuestros colaboradores.”
                            </p>
                        </div>
                    </div>

                    {/* Cliente 4 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
                        <img src="/brands/cafe-martinez.png" alt="Café Martínez" className="h-10 w-32 object-contain transition-all duration-300 transform hover:scale-105" />
                        <div>
                            <h3 className="text-xl font-semibold text-indigo-600">Café Martínez</h3>
                            <p className="text-gray-600 mt-2">
                                “Gracias a SIGRH+, hemos optimizado la contratación y gestión de nuestro personal, mejorando la experiencia de nuestros equipos de trabajo.”
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
