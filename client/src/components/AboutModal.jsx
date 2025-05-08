export default function AboutModal({ onClose }) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white text-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg">
          <h2 className="text-lg font-bold mb-2">Sobre SIGRH+</h2>
          <p className="text-sm mb-4">
            SIGRH+ es un sistema de gestión de recursos humanos desarrollado por 404 Safehouse Not Found. 
            Nuestro objetivo es facilitar la organización del talento humano con tecnología accesible, potente y enfocada en las personas.
          </p>
          <button onClick={onClose} className="text-indigo-600 hover:underline text-sm">
            Cerrar
          </button>
        </div>
      </div>
    );
  }
  