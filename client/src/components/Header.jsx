import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const menuRef = useRef(null);

  
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowLoginMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Inicio",    path: "/" },
    { label: "Productos", path: "/productos" },
    { label: "Precios",   path: "/precios" },
    { label: "Clientes",  path: "/clientes" },
  ];

  return (
 <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 shadow-sm bg-white/80 backdrop-blur-sm">
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        className="text-2xl font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
      >
        SIGRH+
      </button>

      {/* Navegación principal */}
      <nav className="flex-1 flex justify-center space-x-6 text-center">
        {navItems.map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`transition-all duration-300 transform hover:scale-105 ${
              location.pathname === path
                ? "text-indigo-600 font-semibold"
                : "hover:text-indigo-500"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Split button de Login */}
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          onClick={() => setShowLoginMenu(prev => !prev)}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 focus:outline-none"
        >
          Iniciar sesión
        </button>

        {showLoginMenu && (
          <div className="origin-top-right absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              <button
                onClick={() => {
                  setShowLoginMenu(false);
                  navigate("/login");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Soy candidato
              </button>
              <button
                onClick={() => {
                  setShowLoginMenu(false);
                  navigate("/empresa");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Soy empresa
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
