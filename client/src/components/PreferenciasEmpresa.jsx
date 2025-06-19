import { useEffect, useState } from "react";

export default function PreferenciasEmpresa({ idEmpresa, onClose, estilosEmpresa, onActualizar }) {
  const [formData, setFormData] = useState({
    slogan: "",
    descripcion: "",
    logo_url: "",
    color_principal: "#2563eb",
    color_secundario: "#f3f4f6",
    color_texto: "#000000"
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/empresa/${idEmpresa}/preferencias`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setFormData({
          slogan: data.slogan || "",
          descripcion: data.descripcion || "",
          logo_url: data.logo_url || "",
          color_principal: data.color_principal || "#2563eb",
          color_secundario: data.color_secundario || "#f3f4f6",
          color_texto: data.color_texto || "#000000",
        });
      })
      .catch(err => console.error("Error al obtener preferencias:", err));
  }, [idEmpresa]);

  const guardarCambios = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/empresa/${idEmpresa}/preferencias`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onActualizar();
        onClose();
      } else {
        console.error("No se pudo actualizar");
      }
    } catch (err) {
      console.error("Error de conexión:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold" style={{ color: "black" }}>Editar preferencias de empresa</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" style={{ color: "black"}}>Slogan</label>
            <input
              type="text"
              value={formData.slogan}
              onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "black"}}>Descripción</label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "black" }}>Logo URL</label>
            <input
              type="text"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "black" }}>Color Principal</label>
            <input
              type="color"
              value={formData.color_secundario}
              onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })}
              className="w-full h-10"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "black" }}>Color Secundario</label>
            <input
              type="color"
              value={formData.color_principal}
              onChange={(e) => setFormData({ ...formData, color_principal: e.target.value })}
              className="w-full h-10"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: "black" }}>Color de texto</label>
            <input
              type="color"
              value={formData.color_texto}
              onChange={(e) => setFormData({ ...formData, color_texto: e.target.value })}
              className="w-full h-10"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
          <button
            onClick={guardarCambios}
            className="px-4 py-2 text-white rounded"
            style={{ backgroundColor: estilosEmpresa.color_principal }}
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}