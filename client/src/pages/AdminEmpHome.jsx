import { useState } from "react";
import { LogOut, User, UserPlus, List } from "lucide-react";

export default function AdminEmpHome() {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold text-indigo-700 mb-8">Panel de Administración de Empresa</h1>
      <p className="text-gray-700 mb-10 text-center">Bienvenido, <strong>Usuario</strong> - Empresa: <strong>Nintendo HR</strong></p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <button onClick={() => {}} className="flex items-center justify-center p-6 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-xl transition space-x-4 shadow-md">
          <User className="w-8 h-8" />
          <span>Ver Perfil</span>
        </button>

        <button onClick={handleOpenModal} className="flex items-center justify-center p-6 bg-green-100 hover:bg-green-200 text-green-800 rounded-xl transition space-x-4 shadow-md">
          <UserPlus className="w-8 h-8" />
          <span>Registrar Manager</span>
        </button>

        <button onClick={() => {}} className="flex items-center justify-center p-6 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl transition space-x-4 shadow-md">
          <List className="w-8 h-8" />
          <span>Listado de Managers</span>
        </button>

        <button onClick={() => {}} className="flex items-center justify-center p-6 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl transition space-x-4 shadow-md">
          <LogOut className="w-8 h-8" />
          <span>Cerrar Sesión</span>
        </button>
      </div>


      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-fade-in-down">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 text-center">Registrar Manager</h2>
            <form className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="text" placeholder="Apellido" className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="password" placeholder="Contraseña" className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="password" placeholder="Confirmar Contraseña" className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />

              <div className="flex justify-between mt-6">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium transition">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition">
                  Registrar
                </button>
              </div>
            </form>

            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
