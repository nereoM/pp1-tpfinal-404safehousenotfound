// 📁 src/pages/CandidatoHome.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, List, FileText, UserPlus, Edit } from "lucide-react";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { JobCard } from "../components/JobCard";
import { SearchBar } from "../components/SearchBar";

export default function CandidatoHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newPhoto, setNewPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [editedNombre, setEditedNombre] = useState("");
  const [editedCorreo, setEditedCorreo] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("No se pudo obtener los datos del usuario");

        const data = await res.json();
        setUser({ ...data, nombre: "Pelon Musk" });
        setEditedNombre("Pelon Musk");
        setEditedCorreo(data.correo);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [API_URL]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        navigate("/login");
      } else {
        const errorData = await res.json();
        console.error("Error en el logout:", errorData);
        alert("Error al cerrar sesión");
      }
    } catch (err) {
      console.error("Error en el fetch:", err);
      alert("Error al cerrar sesión");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setNewPhoto(file);
    setPreviewPhoto(URL.createObjectURL(file));
  };

  const handleSubmitProfile = async () => {
    const formData = new FormData();
    formData.append("nombre", editedNombre);
    formData.append("correo", editedCorreo);
    if (newPhoto) formData.append("foto", newPhoto);

    try {
      const res = await fetch(`${API_URL}/usuarios/actualizar-perfil`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al actualizar el perfil");
      setShowModal(false);
      location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading || error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-sky-200">
        <div className={`text-lg ${error ? "text-red-500" : "text-white"}`}>
          {error || "Cargando..."}
        </div>
      </div>
    );
  }

  const ofertas = [
    {
      titulo: "Ingeniería Civil",
      empresa: "Techint",
      coincidencia: 87,
      palabrasClave: ["AutoCAD", "Plant 3D", "Revit"],
    },
    {
      titulo: "QA Analyst",
      empresa: "Nintendo",
      coincidencia: 13,
      palabrasClave: ["Unity Engine con C#", "Testing", "Jira"],
    },
  ];

  return (
    <PageLayout>
      <TopBar username={user?.nombre} onLogout={handleLogout}>
        <div className="flex items-center gap-6">
          <SearchBar onSearch={(value) => console.log("Buscando:", value)} />
        </div>
      </TopBar>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="relative">
          <ProfileCard
            nombre={user?.nombre}
            correo={user?.correo}
            cvUrl={user?.cvUrl || "#"}
            fotoUrl={previewPhoto || user?.fotoUrl || undefined}
          />
          <button
            onClick={() => setShowModal(true)}
            className="absolute top-2 right-2 p-1 bg-sky-100 border border-sky-300 rounded-full shadow hover:bg-sky-200"
          >
            <Edit size={16} />
          </button>
        </div>

        <div className="col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-sky-800">Ofertas recomendadas</h2>
          {ofertas.map((oferta, index) => (
            <JobCard
              key={index}
              {...oferta}
              onPostularse={() => alert(`Te postulaste a ${oferta.titulo}`)}
            />
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-sky-50 p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Editar perfil</h2>
            <input
              type="text"
              value={editedNombre}
              onChange={(e) => setEditedNombre(e.target.value)}
              placeholder="Nombre"
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              value={editedCorreo}
              onChange={(e) => setEditedCorreo(e.target.value)}
              placeholder="Correo"
              className="w-full p-2 border rounded"
            />
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {previewPhoto && <img src={previewPhoto} alt="Vista previa" className="w-24 h-24 object-cover rounded-full mt-2" />}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
              <button onClick={handleSubmitProfile} className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
