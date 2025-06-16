import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";

export default function PageLayout({ children }) {
  const { estilos, textColor } = useEstiloEmpresa();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: estilos.color_secundario,
        color: textColor
      }}
    >
      <div className="max-w-6xl mx-auto px-4 pb-6">
        {children}
      </div>
    </div>
  );
}
