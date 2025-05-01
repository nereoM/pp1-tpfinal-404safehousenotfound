export function ProfileCard({ nombre, correo, cvUrl, fotoUrl }) {
    return (
      <div className="bg-white p-4 rounded shadow space-y-2 text-center">
        {fotoUrl && (
          <img
            alt="Foto de perfil"
            className="w-24 h-24 object-cover rounded-full mx-auto"
          />
        )}
        <div className="text-lg font-semibold">{nombre}</div>
        <div className="text-sm text-gray-500">{correo}</div>
        <a
          href={cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline text-sm"
        >
          Ver CV
        </a>
      </div>
    );
  }
  