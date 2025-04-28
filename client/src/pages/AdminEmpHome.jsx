import { useState, useEffect } from "react";
import { LogOut, User, UserPlus, List } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminEmpHome() {
  const [showModal, setShowModal] = useState(false);
  const [userInfo, setUserInfo] = useState({ username: "", empresa: "" });

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const info = localStorage.getItem("userInfo");
    if (info) {
      setUserInfo(JSON.parse(info));
    }
  }, []);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("userInfo");
      navigate("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-10 px-4 relative">

     
      <img src="/iconoblack.png" alt="Logo" className="w-12 h-12 absolute top-4 left-4" />

      <h1 className="text-3xl font-bold text-indigo-700 mb-8">Panel de Administración de Empresa</h1>
      <p className="text-gray-700 mb-10 text-center">
        Bienvenido, <strong>{userInfo.username}</strong> - Empresa: <strong>{userInfo.empresa}</strong>
      </p>

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <button onClick={() => {}} className="flex items-center justify-center p-6 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition space-x-4 shadow-lg">
          <User className="w-8 h-8" />
          <span>Ver Perfil</span>
        </button>

        <button onClick={handleOpenModal} className="flex items-center justify-center p-6 bg-green-500 hover:bg-green-600 text-white rounded-xl transition space-x-4 shadow-lg">
          <UserPlus className="w-8 h-8" />
          <span>Registrar Manager</span>
        </button>

        <button onClick={() => {}} className="flex items-center justify-center p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition space-x-4 shadow-lg">
          <List className="w-8 h-8" />
          <span>Listado de Managers</span>
        </button>

        <button onClick={handleLogout} className="flex items-center justify-center p-6 bg-red-500 hover:bg-red-600 text-white rounded-xl transition space-x-4 shadow-lg">
          <LogOut className="w-8 h-8" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

   
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-fade-in-down overflow-hidden">

            <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Registrar Manager</h2>

            <p className="text-sm text-center text-gray-500 mb-6">
              Estás registrando un Manager para: <strong>{userInfo.empresa}</strong>
            </p>

            <form className="space-y-4">

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Fulano"
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:ring-2 hover:ring-indigo-300 transition"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Apellido</label>
                <input
                  type="text"
                  placeholder="Ej: Mengano"
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:ring-2 hover:ring-indigo-300 transition"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Ej: fulano@gmail.com"
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:ring-2 hover:ring-indigo-300 transition"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Contraseña</label>
                <input
                  type="password"
                  placeholder="Contraseña segura"
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:ring-2 hover:ring-indigo-300 transition"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Confirmar Contraseña</label>
                <input
                  type="password"
                  placeholder="Repetir contraseña"
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:ring-2 hover:ring-indigo-300 transition"
                />
              </div>

              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg bg-indigo-300 text-white font-medium transition cursor-not-allowed"
                >
                  Registrar
                </button>
              </div>
            </form>

           
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✖
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
