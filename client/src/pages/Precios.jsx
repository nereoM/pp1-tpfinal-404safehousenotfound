import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react"; 

export default function Precios() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans">
            {/* Header */}
            <Header />

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
