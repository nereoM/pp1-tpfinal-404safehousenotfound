import React, { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";

export default function ModalParaEditarPerfil({
  isOpen,
  onClose,
  user,
  onSave,
  onFileSelect
}) {
  const [username, setUsername] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setNombre(user.nombre || "");
      setApellido(user.apellido || "");
      setEmail(user.correo || "");
      setPassword("");
      setPreview(user.foto_url || user.fotoUrl || "https://i.pravatar.cc/150?img=12");
      setFileName("");
    }
  }, [user, isOpen]);

  const handleFileChange = (file) => {
    if (file) {
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleSubmit = () => {
    onSave({ username, nombre, apellido, email, password });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4 relative text-black">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-black hover:text-gray-700"
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-semibold mb-2 text-center">Editar perfil</h2>
        <div className="flex flex-col items-center gap-2">
          <img
            src={preview}
            alt="Previsualización"
            className="w-24 h-24 rounded-full border-2 border-blue-500 object-cover mb-2"
          />
          <label className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded cursor-pointer bg-gray-100 hover:bg-gray-200 transition">
            <Upload className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">Cambiar foto de perfil</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
          {fileName && (
            <span className="text-xs text-gray-500 mt-1">
              Archivo seleccionado: <b>{fileName}</b>
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 border rounded text-black"
            placeholder="Nombre"
          />
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className="w-full p-2 border rounded text-black"
            placeholder="Apellido"
          />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded text-black"
            placeholder="Nombre de usuario"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded text-black"
            placeholder="Correo electrónico"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded text-black"
            placeholder="Nueva contraseña (opcional)"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}