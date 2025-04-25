import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Inicio", path: "/" },
    { label: "Productos", path: "/productos" },
    { label: "Precios", path: "/precios" },
    { label: "Clientes", path: "/clientes" },
  ];

  return (
    <header className="flex justify-between items-center px-8 py-4 shadow-sm bg-white/80 backdrop-blur-sm">
      <div className="text-2xl font-bold text-indigo-600">SIGRH+</div>
      <div className="flex-1 flex justify-center">
        <nav className="space-x-6 text-center">
          {navItems.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`transition-all duration-300 transform hover:scale-105 ${
                location.pathname === path
                  ? "text-indigo-600 font-semibold underline"
                  : "hover:text-indigo-500"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div>
        <button
          onClick={() => navigate("/login")}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105"
        >
          Iniciar sesión
        </button>
      </div>
    </header>
  );
}
