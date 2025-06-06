import { Edit } from "lucide-react";
import React, { useMemo } from "react";
import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";

export function ProfileCard({ nombre, correo, cvUrl, fotoUrl, onEdit }) {
  console.log({fotoUrl});
  

  const API_URL = import.meta.env.VITE_API_URL;
  const { estilos } = useEstiloEmpresa();

  const bg = estilos?.color_secundario || "white";
  const bcol = estilos?.color_principal || "#2563eb";
  const tcol = estilos?.color_texto || "#000000";

  // Construye la URL de la imagen, evitando prefijos duplicados
  const imgSrc = useMemo(() => {
    if (!fotoUrl) return null;
    const cleanPath = fotoUrl.replace(/^\/+/, "");
    // Si la ruta ya es absoluta, usarla directamente
    if (cleanPath.startsWith("http")) return cleanPath;
    // Prefijar API_URL y usar la ruta tal cual viene del backend
    return `${API_URL}/${cleanPath}`;
  }, [fotoUrl, API_URL]);

  return (
    <div
      className="p-4 rounded shadow space-y-2 text-center relative"
      style={{ backgroundColor: bg, border: `2px solid ${bcol}`, color: tcol }}
    >
      <img
        src={imgSrc || "https://i.pravatar.cc/150?img=12"}
        alt={imgSrc ? "Foto de perfil" : "Avatar por defecto"}
        className="w-24 h-24 object-cover rounded-full mx-auto"
        style={{ border: `2px solid ${bcol}` }}
      />
      <div className="text-lg font-semibold">{nombre}</div>
      <div className="text-sm opacity-80">{correo}</div>
      {cvUrl && (
        <a
          href={`${API_URL}/${cvUrl.replace(/^\//, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-3 py-1 mt-2 text-sm rounded shadow"
          style={{ backgroundColor: bcol, color: "#fff" }}
        >
          Ver CV subido
        </a>
      )}
<button
  onClick={onEdit}
  className="absolute top-2 right-2 p-1 rounded-full hover:opacity-90 transition-opacity"
  style={{
    backgroundColor: bcol,  
    color: tcol           
  }}
>
  <Edit size={16} color={tcol} />
</button>

    </div>
  );
}