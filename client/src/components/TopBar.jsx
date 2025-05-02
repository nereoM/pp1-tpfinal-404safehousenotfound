import { useTheme } from "./ThemeContext";



export function TopBar({ username, onLogout }) {
  const { theme } = useTheme();

  return (
    <header
      className="w-full px-6 py-3 flex justify-between items-center shadow"
      style={{ backgroundColor: theme.color_princ, color: theme.color_texto }}
    >
      <div className="flex items-center gap-3">
        <img src={theme.logo_url} alt="Logo" className="h-8" />
        <h1 className="font-bold text-lg">{theme.slogan}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span>{username}</span>
        <button
          onClick={onLogout}
          className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
