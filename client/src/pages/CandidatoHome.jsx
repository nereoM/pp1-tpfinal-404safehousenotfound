// 📁 src/pages/CandidatoHome.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit } from "lucide-react";
import { motion } from "framer-motion";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { JobCard } from "../components/JobCard";
import { SearchBar } from "../components/SearchBar";
import { Search } from "lucide-react";

export default function CandidatoHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newPhoto, setNewPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [editedNombre, setEditedNombre] = useState("");
  const [editedCorreo, setEditedCorreo] = useState("");
  const [cvFile, setCvFile] = useState(null);

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
        setUser(data);
        setEditedNombre(`${data.nombre} ${data.apellido}`);
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

  const handleCVChange = (e) => {
    setCvFile(e.target.files[0]);
  };

  const handleSubmitProfile = async () => {
    const formData = new FormData();
    formData.append("nombre", editedNombre);
    formData.append("correo", editedCorreo);
    if (newPhoto) formData.append("foto", newPhoto);
    if (cvFile) formData.append("cv", cvFile);

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
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className={`text-lg ${error ? "text-red-500" : "text-gray-600"}`}>
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
      fecha: "hace 2 días",
      postulaciones: 42,
    },
    {
      titulo: "QA Analyst",
      empresa: "Nintendo",
      coincidencia: 13,
      palabrasClave: ["Unity Engine con C#", "Testing", "Jira"],
      fecha: "ayer",
      postulaciones: 19,
    },
  ];

  const ofertasFiltradas = ofertas
    .filter((oferta) =>
      oferta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oferta.palabrasClave.some((palabra) =>
        palabra.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => b.coincidencia - a.coincidencia);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50"
    >
      <PageLayout>
        <TopBar username={`${user?.nombre} ${user?.apellido}`} onLogout={handleLogout}>
          <div className="relative group">
            <input
              type="text"
              placeholder="Buscar..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="transition-all w-32 group-focus-within:w-60 duration-300 ease-in-out p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
            <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </TopBar>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 px-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <ProfileCard
              nombre={`${user?.nombre} ${user?.apellido}`}
              correo={user?.correo}
              cvUrl={user?.cvUrl || "#"}
              fotoUrl={previewPhoto || user?.fotoUrl || "https://i.pravatar.cc/150?img=12"}
            />
            <button
              onClick={() => setShowModal(true)}
              className="absolute top-2 right-2 p-1 bg-white border border-gray-300 rounded-full hover:bg-gray-100"
            >
              <Edit size={16} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="col-span-2 space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-700">Ofertas recomendadas</h2>
            {ofertasFiltradas.map((oferta, index) => (
              <JobCard
                key={index}
                {...oferta}
                onPostularse={() => {
                  const div = document.createElement("div");
                  div.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow transition-opacity duration-300";
                  div.textContent = `¡Te postulaste a ${oferta.titulo} con éxito!`;
                  document.body.appendChild(div);
                  setTimeout(() => {
                    div.style.opacity = "0";
                  }, 2000);
                  setTimeout(() => {
                    div.remove();
                  }, 2500);
                }}
              />
            ))}
          </motion.div>
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-center text-gray-800">Editar perfil</h2>
              <input
                type="text"
                value={editedNombre}
                onChange={(e) => setEditedNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="email"
                value={editedCorreo}
                onChange={(e) => setEditedCorreo(e.target.value)}
                placeholder="Correo"
                className="w-full p-2 border rounded"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-black">
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16h16V4H4zm8 14a4 4 0 100-8 4 4 0 000 8zm4-10h.01" />
  </svg>
  <span>Subir foto de perfil</span>
  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
</label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Subir CV</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVChange} className="hidden" />
              </label>
             
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Cancelar</button>
                <button onClick={handleSubmitProfile} className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 shadow">Guardar</button>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </motion.div>
  );
}
