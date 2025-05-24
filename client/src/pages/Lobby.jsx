import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Lobby() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-800 font-sans">
      {/* header */}
      <Header />

      {/* zona central */}
      <main className="pt-28 flex flex-col md:flex-row items-center justify-between px-12 pb-20 max-w-7xl mx-auto">
        <div className="max-w-xl mb-10 md:mb-0">
          <h1 className="text-4xl font-bold mb-4 text-indigo-700">
            Transformamos el talento en oportunidades reales
          </h1>
          <p className="text-gray-600 mb-6">
            En SIGRH+ creemos en el desarrollo profesional de las personas y en la evolución constante de las organizaciones.
            Nuestra plataforma facilita a los candidatos encontrar oportunidades laborales de forma rápida y eficiente,
            al mismo tiempo que permite a las empresas gestionar sus procesos de reclutamiento de manera personalizada y estratégica.
          </p>
          <p className="text-gray-600 mb-6">
            Si representás a una empresa y buscás optimizar tu gestión de talento, conocé nuestros planes diseñados a medida para acompañar tu crecimiento.
          </p>
          <button
            onClick={() => navigate("/precios")}
            className="bg-indigo-500 text-white px-6 py-3 rounded-full hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105"
          >
            Ver planes empresariales
          </button>
        </div>

        <img
          src="/person-using-sigrh-happy.png"
          alt="Persona feliz usando SIGRH+"
          className="w-full max-w-md rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        />
      </main>

      {/* características destacadas */}
      <section className="py-12 bg-gray-100 text-center">
        <h2 className="text-3xl font-semibold text-indigo-700 mb-6">Características destacadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-8">
          <div className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
            <h3 className="font-semibold text-lg text-indigo-600 mb-3">Automatización Total</h3>
            <p className="text-gray-600">Gestioná tu equipo de forma más eficiente, con procesos automatizados que ahorran tiempo y recursos.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
            <h3 className="font-semibold text-lg text-indigo-600 mb-3">Análisis de Datos</h3>
            <p className="text-gray-600">Accedé a informes detallados sobre el rendimiento de tu equipo con gráficos fáciles de entender.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
            <h3 className="font-semibold text-lg text-indigo-600 mb-3">Soporte 24/7</h3>
            <p className="text-gray-600">Nuestro equipo de soporte está disponible las 24 horas del día, los 7 días de la semana, para ayudarte cuando lo necesites.</p>
          </div>
        </div>
      </section>

      {/* testimonios */}
      <section className="py-12 bg-indigo-50 text-center">
        <h2 className="text-3xl font-semibold text-indigo-700 mb-6">Lo que dicen nuestros clientes</h2>
        <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-xs transition-all duration-300 transform hover:scale-105">
            <p className="text-gray-600 italic mb-4">"SIGRH+ ha transformado la forma en que gestionamos a nuestro equipo. La automatización nos ha permitido concentrarnos en lo que realmente importa."</p>
            <p className="font-semibold text-indigo-600">Ana González</p>
            <p className="text-gray-500">Directora de Recursos Humanos</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-xs transition-all duration-300 transform hover:scale-105">
            <p className="text-gray-600 italic mb-4">"Gracias a SIGRH+, hemos logrado un control total sobre el seguimiento de postulaciones y la evaluación de desempeño de nuestro equipo."</p>
            <p className="font-semibold text-indigo-600">Carlos Fernández</p>
            <p className="text-gray-500">Gerente de Operaciones</p>
          </div>
        </div>
      </section>

      {/* fotitos empresa */}
      <footer className="bg-white/60 py-6 mt-16 text-center text-gray-600 backdrop-blur-sm">
        <p className="mb-4 font-semibold">Estas empresas confían en nosotros</p>
        <div className="flex flex-wrap justify-center gap-8 items-center max-w-5xl mx-auto">
          <img src="/brands/nintendo.png" alt="Nintendo" className="h-10 w-32 object-contain transition-all duration-300 transform hover:scale-105" />
          <img src="/brands/capcom.png" alt="Capcom" className="h-10 w-32 object-contain transition-all duration-300 transform hover:scale-105" />
          <img src="/brands/mappa.png" alt="Mappa" className="h-10 w-32 object-contain transition-all duration-300 transform hover:scale-105" />
          <img src="/brands/cafe-martinez.png" alt="Café Martínez" className="h-10 w-32 object-contain transition-all duration-300 transform hover:scale-105" />
        </div>
      </footer>
    </div>
  );
}
