export function ProfileCard({ nombre, correo, cvUrl, fotoUrl }) {
  const API_URL = import.meta.env.VITE_API_URL;

  return (
    <div className="bg-white p-4 rounded shadow space-y-2 text-center">
      {fotoUrl && (
        <img
          src={fotoUrl}
          alt="Foto de perfil"
          className="w-24 h-24 object-cover rounded-full mx-auto"
        />
      )}
      <div className="text-lg font-semibold">{nombre}</div>
      <div className="text-sm text-gray-500">{correo}</div>

      {cvUrl && (
        <a
          href={`${API_URL}${cvUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-3 py-1 mt-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow"
        >
          📄 Ver CV subido
        </a>
      )}
    </div>
  );
}
