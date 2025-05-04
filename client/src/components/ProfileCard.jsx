import React from "react";
import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";

export function ProfileCard({ nombre, correo, cvUrl, fotoUrl }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { estilos } = useEstiloEmpresa();

  const bg   = estilos?.color_secundario  || "white";
  const bcol = estilos?.color_principal   || "#2563eb";
  const tcol = estilos?.color_texto       || "#000000"; // Agregamos el color de texto

  return (
    <div
      className="p-4 rounded shadow space-y-2 text-center"
      style={{
        backgroundColor: bg,
        border: `2px solid ${bcol}`,
        color: tcol  // Aplicamos color de texto a todo el bloque
      }}
    >
      {fotoUrl && (
        <img
          src={fotoUrl}
          alt="Foto de perfil"
          className="w-24 h-24 object-cover rounded-full mx-auto"
          style={{ border: `2px solid ${bcol}` }}
        />
      )}
      <div className="text-lg font-semibold">{nombre}</div>
      <div className="text-sm opacity-80">{correo}</div>

      {cvUrl && (
        <a
          href={`${API_URL}${cvUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-3 py-1 mt-2 text-sm rounded shadow"
          style={{
            backgroundColor: bcol,
            color: "#fff"
          }}
        >
          📄 Ver CV subido
        </a>
      )}
    </div>
  );
}
