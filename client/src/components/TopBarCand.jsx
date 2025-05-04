import React from "react";

export function TopBar({ username, onLogout, children }) {
  const blue = "#3b82f6"; // Azul firme, menos pastel
  const textColor = "#ffffff"; // Texto blanco sobre azul

  return (
    <header
      className="flex justify-between items-center py-4 px-6 border-b"
      style={{ borderColor: blue, backgroundColor: "#ffffff", color: blue }}
    >
      <div className="flex items-center gap-4">
        <h1
          className="text-2xl font-bold px-3 py-1 rounded"
          style={{
            color: blue
          }}
        >
          SIGRH+
        </h1>
        {children}
      </div>

      <div className="flex items-center gap-4">
        <span className="font-medium" style={{ color: blue }}>
          Bienvenido, {username}
        </span>
        <button
          onClick={onLogout}
          className="px-3 py-1 rounded"
          style={{
            backgroundColor: blue,
            color: textColor,
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
