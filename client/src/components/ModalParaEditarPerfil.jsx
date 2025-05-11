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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.correo || "");
      setPassword("");
    }
  }, [user, isOpen]);

  const handleSubmit = () => {
    onSave({ username, email, password });
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
        <h2 className="text-lg font-semibold">Editar perfil</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded text-black"
          placeholder="Username"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded text-black"
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded text-black"
          placeholder="Nueva contraseña (opcional)"
        />
        <div className="w-full">
          <label className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded cursor-pointer bg-gray-100 hover:bg-gray-200 transition">
            <Upload className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">Nueva foto de perfil</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileSelect(e.target.files[0])}
              className="hidden"
            />
          </label>
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
