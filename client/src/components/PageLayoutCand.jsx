export default function PageLayout({ children }) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#ffffff", // Fondo blanco
        color: "#000000" // Texto negro para contraste básico
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
