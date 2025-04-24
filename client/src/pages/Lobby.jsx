import { useNavigate } from "react-router-dom";

export default function Lobby() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="text-2xl font-bold text-indigo-600">SIGRH+</div>
        <div className="flex-1 flex justify-center">
          <nav className="space-x-6 text-center">
            <button onClick={() => navigate("/productos")} className="hover:text-indigo-500 transition-colors duration-200">Productos</button>
            <button onClick={() => navigate("/precios")} className="hover:text-indigo-500 transition-colors duration-200">Precios</button>
            <button onClick={() => navigate("/clientes")} className="hover:text-indigo-500 transition-colors duration-200">Clientes</button>
          </nav>
        </div>
        <div>
          <button onClick={() => navigate("/login")} className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors duration-200">
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* Main section */}
      <main className="flex flex-col md:flex-row items-center justify-between px-8 py-16 max-w-7xl mx-auto">
        <div className="max-w-xl mb-10 md:mb-0">
          <h1 className="text-4xl font-bold mb-4 text-indigo-700">Gestioná tu equipo con el poder de SIGRH+</h1>
          <p className="text-gray-600 mb-6">
            Nuestra plataforma unifica los tres modelos clave: Gestión de Recursos Humanos, Seguimiento de Candidatos y Evaluación de Desempeño. Todo en uno.
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            <li><strong>RRHH:</strong> Automatización y administración centralizada.</li>
            <li><strong>ATS:</strong> Seguimiento eficiente de postulaciones.</li>
            <li><strong>Evaluación:</strong> Medición del rendimiento y potencial de cada colaborador.</li>
          </ul>
          <button onClick={() => navigate("/precios")} className="bg-indigo-500 text-white px-5 py-3 rounded hover:bg-indigo-600 transition-colors duration-200">
            Ver precios
          </button>
        </div>

        <img
          src="/person-using-sigrh-happy.png"
          alt="Persona feliz usando SIGRH+"
          className="w-full max-w-md rounded-xl shadow-lg"
        />
      </main>

      {/* Footer / Brands section */}
      <footer className="bg-white/60 py-6 mt-16 text-center text-gray-600 backdrop-blur-sm">
        <p className="mb-4 font-semibold">Confiado por empresas líderes</p>
        <div className="flex flex-wrap justify-center gap-8 items-center max-w-5xl mx-auto">
          <img src="/brands/nintendo.png" alt="Nintendo" className="h-10 w-32 object-contain" />
          <img src="/brands/capcom.png" alt="Capcom" className="h-10 w-32 object-contain" />
          <img src="/brands/mappa.png" alt="Mappa" className="h-10 w-32 object-contain" />
          <img src="/brands/cafe-martinez.png" alt="Café Martínez" className="h-10 w-32 object-contain" />
        </div>
      </footer>
    </div>
  );
}
