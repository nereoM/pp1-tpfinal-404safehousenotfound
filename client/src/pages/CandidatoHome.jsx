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
  const [mensajeRecomendacion, setMensajeRecomendacion] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, cvRes] = await Promise.all([
          fetch(`${API_URL}/auth/me`, { credentials: "include" }),
          fetch(`${API_URL}/api/mis-cvs`, { credentials: "include" })
        ]);

        if (!userRes.ok) throw new Error("Error al obtener usuario");
        if (!cvRes.ok) throw new Error("Error al obtener CVs");

        const userData = await userRes.json();
        const cvsData = await cvRes.json();
        

        setUser(userData);
        setCvs(cvsData);
        setCvSeleccionado(cvsData[0]?.id || null);

        fetchRecomendaciones();
      } catch (err) {
        console.error("❌ Error en fetchData:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchRecomendaciones = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recomendaciones`, { credentials: "include" });

        const data = await res.json();
        if (!res.ok) {
          if (data.error?.includes("no tiene un CV cargado")) {
            setMensajeRecomendacion("Subí un CV para recibir recomendaciones personalizadas.");
            setOfertas([]);
            setLoading(false);
            return;
          } else {
            throw new Error(data.error || "Error desconocido en recomendaciones");
          }
        }

        

        const transformadas = data.map((item) => ({
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
        console.error("❌ Error en fetchRecomendaciones:", err);
        setMensajeRecomendacion("No se pudieron cargar las recomendaciones.");
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
        setMensajeRecomendacion("");
        const resRecom = await fetch(`${API_URL}/api/recomendaciones`, { credentials: "include" });
        const dataRecom = await resRecom.json();
        if (resRecom.ok) {
          const transformadas = dataRecom.map((item) => ({
            id: item.id_oferta,
            titulo: item.nombre_oferta,
            empresa: item.empresa,
            coincidencia: item.coincidencia,
            palabrasClave: item.palabras_clave,
            fecha: "Reciente",
            postulaciones: Math.floor(Math.random() * 100),
          }));
          setOfertas(transformadas);
        } else {
          setMensajeRecomendacion("CV subido, pero aún no hay recomendaciones disponibles.");
        }
      } else {
        alert("Error: " + (result.error || "desconocido"));
      }
    } catch (error) {
      console.error("❌ Error al subir CV:", error);
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
    } catch (err) {
      console.error("❌ Error en handlePostularse:", err);
      alert("❌ Error de conexión al postularse");
    }
  };

  const ofertasFiltradas = ofertas
    .filter((o) =>
      o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.palabrasClave.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.coincidencia - a.coincidencia);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <PageLayout>
        <TopBar username={`${user?.nombre} ${user?.apellido}`} onLogout={() => navigate("/login")} />
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
                    {cv.nombre_archivo || new Date(cv.fecha_subida).toLocaleDateString()}
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
            {mensajeRecomendacion ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center text-center bg-white border border-gray-200 p-6 rounded shadow-md"
              >
                <p className="text-gray-600 text-base">{mensajeRecomendacion}</p>
              </motion.div>
            ) : (
              ofertasFiltradas.map((oferta, index) => (
                <motion.div
                  key={`oferta-${oferta.id ?? index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <JobCard {...oferta} onPostularse={() => handlePostularse(oferta.id)} />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </PageLayout>
    </motion.div>
  );
}
