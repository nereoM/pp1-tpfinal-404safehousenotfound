import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
    { label: "Inicio", path: "/" },
    { label: "Productos", path: "/productos" },
    { label: "Precios", path: "/precios" },
    { label: "Clientes", path: "/clientes" },
  ];

  return (
    <header className="fixed top-0 text-gray-800 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 py-4 shadow-sm bg-white">
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        className="text-2xl font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
      >
        SIGRH+
      </button>

      {/* Navegación principal (desktop) */}
      <nav className="hidden md:flex flex-1 justify-center space-x-6 text-center">
        {navItems.map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`transition-all duration-300 transform hover:scale-105 ${location.pathname === path
              ? "text-indigo-600 font-semibold"
              : "hover:text-indigo-500"
              }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Split button de Login (desktop) */}
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          onClick={() => setShowLoginMenu((prev) => !prev)}
          className="hidden md:inline-block bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 focus:outline-none"
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

      {/* Botón menú hamburguesa (solo móvil, bien a la derecha) */}
      <button
        className="md:hidden ml-2 text-indigo-600 hover:text-indigo-800 focus:outline-none"
        onClick={() => setShowMobileMenu((prev) => !prev)}
        aria-label="Abrir menú"
        style={{ order: 9999 }} // fuerza el botón a la derecha en mobile
      >
        {showMobileMenu ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
      </button>

      {/* Menú móvil */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/40 flex">
          <div className="bg-white w-64 h-full shadow-lg flex flex-col p-6 space-y-4">
            <button
              className="self-end mb-4 text-indigo-600 hover:text-indigo-800"
              onClick={() => setShowMobileMenu(false)}
              aria-label="Cerrar menú"
            >
              <X className="w-7 h-7" />
            </button>
            {navItems.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => {
                  setShowMobileMenu(false);
                  navigate(path);
                }}
                className={`text-lg text-left py-2 px-2 rounded transition ${location.pathname === path
                  ? "text-indigo-600 font-semibold"
                  : "hover:bg-indigo-50"
                  }`}
              >
                {label}
              </button>
            ))}
            <hr />
            <Link
              to="/login"
              className="w-full text-left px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded"
            >
              Iniciar Sesion Candidato
            </Link>
            <Link
              to="/empresa"
              className="w-full text-left px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded"
            >
              Iniciar Sesion Empresa
            </Link>
          </div>
          {/* Clic fuera del menú cierra el menú */}
          <div
            className="flex-1"
            onClick={() => setShowMobileMenu(false)}
            tabIndex={-1}
          />
        </div>
      )}
    </header>
  );
}