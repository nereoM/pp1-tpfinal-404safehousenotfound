import React from "react";

export default function MensajeAlerta({ texto = "", className = "" }) {
  if (!texto) return null;

  const textoLower = texto.toLowerCase();

  const esError =
    textoLower.includes("error") ||
    textoLower.includes("falló") ||
    textoLower.includes("requerido") ||
    textoLower.includes("seleccione") ||
    textoLower.includes("obligatorio");

  const colorClasses = esError
    ? "bg-red-100 text-red-800"
    : "bg-green-100 text-green-800";

  return (
    <div className={`mb-4 p-3 rounded text-sm font-medium ${colorClasses} ${className}`}>
      {texto}
    </div>
  );
}
