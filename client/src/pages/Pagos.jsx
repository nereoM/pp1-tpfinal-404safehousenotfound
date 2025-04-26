export default function Pagos() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">


        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-indigo-700">
            Suscribite a SIGRH+
          </h1>
          <p className="text-gray-600 text-lg">
            Simplificá la gestión de talento en tu empresa. Administrá postulaciones, evaluaciones y desempeños de forma ágil y profesional.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Planes flexibles</li>
            <li>Gestión integral de RRHH</li>
            <li>Acceso inmediato y soporte 24/7</li>
          </ul>
          <img
            src="/images/sigrh-platform-preview.png"
            className="rounded-xl shadow-lg"
          />
        </div>


        <div className="bg-white p-8 rounded-2xl shadow-2xl space-y-6">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 text-center">
            Datos de suscripción
          </h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Apellido"
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <input
              type="text"
              placeholder="Empresa"
              className="w-full border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Número de tarjeta"
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Nombre en la tarjeta"
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Vencimiento (MM/YY)"
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Código de seguridad (CVV)"
                className="border p-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="text-gray-600 text-sm">
                Acepto los{" "}
                <a href="#" className="text-indigo-600 underline">
                  Términos y Condiciones
                </a>
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Confirmar y suscribirme
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
