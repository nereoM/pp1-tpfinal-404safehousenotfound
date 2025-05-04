import React from "react";
import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";
import isLightColor from "../components/isLightColor";

export function TopBar({ username, onLogout, children }) {
  const { estilos } = useEstiloEmpresa();
  const primary = estilos?.color_principal ?? "#2563eb";
  const logoUrl = estilos?.logo_url ?? null;

  // Ajustar color del texto según contraste del fondo (principal)
  const contrastText = isLightColor(primary) ? "#000000" : "#ffffff";

  return (
    <header
      className="flex justify-between items-center py-4 px-6 border-b"
      style={{ borderColor: primary, color: contrastText }}
    >
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo empresa"
            className="h-8 w-auto"
          />
        ) : (
          <h1 className="text-2xl font-bold" style={{ color: primary }}>
            SIGRH+
          </h1>
        )}
        {children}
      </div>

      <div className="flex items-center gap-4">
        <span className="font-medium">Bienvenido, {username}</span>
        <button
          onClick={onLogout}
          className="px-3 py-1 rounded"
          style={{
            backgroundColor: primary,
            color: contrastText,
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
