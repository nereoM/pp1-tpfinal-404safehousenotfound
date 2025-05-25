import React from "react";

export default function MensajeAlerta({ texto = "", className = "", tipo }) {
  if (!texto) return null;

  let esError;

  if (tipo) {
    esError = tipo === "error";
  } else {
    const textoLower = texto.toLowerCase();

    esError =
      textoLower.includes("error") ||
      textoLower.includes("falló") ||
      textoLower.includes("requerido") ||
      textoLower.includes("seleccione") ||
      textoLower.includes("selecciona") ||  // <- Agregado
      textoLower.includes("obligatorio") ||
      textoLower.includes("caracter") ||
      textoLower.includes("unexpected token") ||
      textoLower.includes("<!doctype")
  }

  const colorClasses = esError
    ? "bg-red-100 text-red-800 border border-red-300"
    : "bg-green-100 text-green-800 border border-green-300";

  return (
    <div className={`mb-4 p-3 rounded text-sm font-medium ${colorClasses} ${className}`}>
      {texto}
    </div>
  );
}
