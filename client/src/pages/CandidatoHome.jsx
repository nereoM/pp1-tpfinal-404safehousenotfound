import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Upload, Search, FileUp } from "lucide-react";
import { motion } from "framer-motion";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { JobCard } from "../components/JobCard";

const API_URL = import.meta.env.VITE_API_URL;

export default function CandidatoHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ofertas, setOfertas] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [cvSeleccionado, setCvSeleccionado] = useState(null);
  const [cvPreview, setCvPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, cvRes, ofertasRes] = await Promise.all([
          fetch(`${API_URL}/auth/me`, { credentials: "include" }),
          fetch(`${API_URL}/api/mis-cvs`, { credentials: "include" }),
          fetch(`${API_URL}/api/recomendaciones`, { credentials: "include" })
        ]);

        if (!userRes.ok) throw new Error("Error al obtener usuario");
        if (!cvRes.ok) throw new Error("Error al obtener CVs");
        if (!ofertasRes.ok) throw new Error("Error al obtener recomendaciones");

        const userData = await userRes.json();
        const cvsData = await cvRes.json();
        const ofertasData = await ofertasRes.json();

        setUser(userData);
        setCvs(cvsData);
        setCvSeleccionado(cvsData[0]?.id || null);

        const transformadas = ofertasData.map((item) => ({
          id: item.id_oferta,
          titulo: item.nombre_oferta,
          empresa: item.empresa,
          coincidencia: item.coincidencia,
          palabrasClave: item.palabras_clave,
          fecha: "Reciente",
          postulaciones: Math.floor(Math.random() * 100),
        }));
        setOfertas(transformadas);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUploadCV = async () => {
    if (!cvFile) return;
    const formData = new FormData();
    formData.append("file", cvFile);

    try {
      const res = await fetch(`${API_URL}/api/upload-cv`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        alert("CV subido exitosamente");
        setCvFile(null);
        setCvPreview(null);
        setCvs((prev) => [result, ...prev]);
        setCvSeleccionado(result.id);
      } else {
        alert("Error: " + (result.error || "desconocido"));
      }
    } catch {
      alert("Error de conexión al subir CV");
    }
  };

  const handlePostularse = async (idOferta) => {
    if (!cvSeleccionado) return alert("Selecciona un CV para postularte");
    try {
      const res = await fetch(`${API_URL}/api/postularme`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_oferta: idOferta, id_cv: cvSeleccionado })
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Postulación realizada con éxito");
      } else {
        alert("❌ Error: " + (data.error || "desconocido"));
      }
    } catch {
      alert("❌ Error de conexión al postularse");
    }
  };

  const ofertasFiltradas = ofertas
    .filter((o) =>
      o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.palabrasClave.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.coincidencia - a.coincidencia);

  if (loading || error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className={`text-lg ${error ? "text-red-500" : "text-gray-600"}`}>
          {error || "Cargando..."}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <PageLayout>
        <TopBar username={`${user?.nombre} ${user?.apellido}`} onLogout={() => navigate("/login")}/>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 px-4">
          <div>
            <ProfileCard
              nombre={`${user?.nombre} ${user?.apellido}`}
              correo={user?.correo}
              fotoUrl={user?.fotoUrl || "https://i.pravatar.cc/150?img=12"}
              cvUrl={cvs[0]?.url || null}
            />

            <div className="mt-3">
              <label className="block mb-2 text-sm text-gray-600">Seleccionar CV</label>
              <select
                className="w-full p-2 border border-gray-300 rounded"
                value={cvSeleccionado}
                onChange={(e) => setCvSeleccionado(e.target.value)}
              >
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {new Date(cv.fecha_subida).toLocaleDateString()} ({cv.tipo_archivo})
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-2 mt-4">
                <label htmlFor="cv-upload" className="flex items-center justify-center gap-2 p-2 border border-dashed border-blue-500 rounded cursor-pointer bg-blue-50 hover:bg-blue-100 transition">
                  <FileUp className="w-4 h-4 text-blue-600" /> Seleccionar archivo
                </label>
                <input
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    setCvFile(e.target.files[0]);
                    setCvPreview(e.target.files[0]?.name || null);
                  }}
                />

                {cvPreview && (
                  <p className="text-sm text-gray-600">Archivo seleccionado: <span className="font-medium">{cvPreview}</span></p>
                )}

                {cvFile && (
                  <button
                    onClick={handleUploadCV}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                  >
                    <Upload className="w-4 h-4" /> Confirmar subida
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Ofertas recomendadas</h2>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Buscar..."
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-40 group-focus-within:w-60 p-2 pl-10 border border-gray-300 rounded focus:outline-none"
                />
                <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {ofertasFiltradas.map((oferta) => (
              <JobCard key={oferta.id} {...oferta} onPostularse={() => handlePostularse(oferta.id)} />
            ))}
          </div>
        </div>
      </PageLayout>
    </motion.div>
  );
}
