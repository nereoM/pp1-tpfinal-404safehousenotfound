export function TopBar({ username, onLogout, children }) {
  return (
    <header className="flex justify-between items-center py-4 border-b border-gray-300">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold text-blue-600">SIGRH+</h1>
        {children}
      </div>
      <div className="flex items-center gap-4">
        <span className="font-medium">Bienvenido, {username}</span>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}