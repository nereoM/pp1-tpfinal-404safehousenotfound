import React from "react";
import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";

// Helper para calcular luminancia y determinar si un color es claro
function isLightColor(hex) {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  // fórmula de luminancia relativa
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 186;
}

export default function PageLayout({ children }) {
  const { estilos } = useEstiloEmpresa();

  // usamos color_secundario como fondo
  const bgColor = estilos?.color_secundario || "#f3f4f6";
  // elegimos texto negro o blanco según contraste
  const textColor = isLightColor(bgColor) ? "#000000" : "#FFFFFF";

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
