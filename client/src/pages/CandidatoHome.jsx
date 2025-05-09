import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Upload, Search, FileUp } from "lucide-react";
import { motion } from "framer-motion";
import PageLayout from "../components/PageLayoutCand";
import { TopBar } from "../components/TopBarCand";
import { ProfileCard } from "../components/ProfileCard";
import { JobCard } from "../components/JobCard";
import { SearchFilters } from "../components/SearchFilters";


const API_URL = import.meta.env.VITE_API_URL;

export default function CandidatoHome() {
    const [searchTerm, setSearchTerm] = useState("");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [ofertas, setOfertas] = useState([]);
    const [cvFile, setCvFile] = useState(null);
    const [cvs, setCvs] = useState([]);
    const [cvPreview, setCvPreview] = useState(null);
    const [mensajeRecomendacion, setMensajeRecomendacion] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [idOfertaSeleccionada, setIdOfertaSeleccionada] = useState(null);
    const [cvSeleccionado, setCvSeleccionado] = useState(null);
    const [salarioPretendido, setSalarioPretendido] = useState("");
    const [busquedaConfirmada, setBusquedaConfirmada] = useState("");
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [modalEditarPerfilOpen, setModalEditarPerfilOpen] = useState(false);
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [username, setUsername] = useState("");
    const [imageFile, setImageFile] = useState(null);         
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, cvRes] = await Promise.all([
                    fetch(`${API_URL}/api/info-candidato`, { credentials: "include" }),
                    fetch(`${API_URL}/api/mis-cvs`, { credentials: "include" })


                ]);

                if (!userRes.ok) throw new Error("Error al obtener usuario");
                if (!cvRes.ok) throw new Error("Error al obtener CVs");

                const userData = await userRes.json();
                console.log("Username:", userData.username);
                setUser(userData);
                const cvsData = await cvRes.json();

                setUser(userData);
                setCvs(cvsData);
                setCvSeleccionado(cvsData[0]?.id || null);
                fetchRecomendaciones();

                setNombre(userData.nombre);
                setApellido(userData.apellido);
                setUsername(userData.username);


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




    useEffect(() => {
        const fetchTodasLasOfertas = async () => {
            const term = busquedaConfirmada.trim();
            if (term.length < 3) return;

            try {
                const res = await fetch(`${API_URL}/api/todas-las-ofertas`, { credentials: "include" });
                const data = await res.json();
                if (res.ok) {
                    const todas = data
                        .filter((item) =>
                            item.nombre_oferta.toLowerCase().includes(term.toLowerCase()) ||
                            item.palabras_clave.some((p) => p.toLowerCase().includes(term.toLowerCase()))
                        )
                        .map((item) => ({
                            id: item.id,
                            titulo: item.nombre_oferta,
                            empresa: item.empresa,
                            palabrasClave: item.palabras_clave,
                            fecha: "Reciente",
                            postulaciones: Math.floor(Math.random() * 100),
                        }));
                    setOfertas(todas);
                } else {
                    console.error("❌ Error en todas-las-ofertas:", data.error);
                }
            } catch (err) {
                console.error("❌ Error al buscar todas las ofertas:", err);
            }
        };

        fetchTodasLasOfertas();
    }, [busquedaConfirmada]);




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
            } else {
                alert("Error: " + (result.error || "desconocido"));
            }
        } catch (error) {
            console.error("❌ Error al subir CV:", error);
            alert("Error de conexión al subir CV");
        }
    };

    const handlePostularse = async () => {
        if (!cvSeleccionado) return alert("Seleccioná un CV para postularte");
        try {
            const res = await fetch(`${API_URL}/api/postularme`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_oferta: idOfertaSeleccionada,
                    id_cv: cvSeleccionado,
                    salario_pretendido: salarioPretendido || null
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert("✅ Postulación realizada con éxito");
                setModalOpen(false);
                setSalarioPretendido("");
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

    const handleImageUpload = async () => {
      if (!imageFile) return alert("Seleccioná una imagen");
  
      const formData = new FormData();
      formData.append("file", imageFile);
  
      try {
          const res = await fetch(`${API_URL}/api/subir-image`, {
              method: "POST",
              credentials: "include",
              body: formData,
          });
  
          const result = await res.json();
          if (res.ok) {
              alert("Imagen subida exitosamente");
              setUser((prev) => ({ ...prev, fotoUrl: result.file_path }));
              setModalEditarPerfilOpen(false); // cerrar modal después de guardar
          } else {
              alert("Error: " + (result.error || "desconocido"));
          }
      } catch (err) {
          console.error("Error al subir imagen:", err);
          alert("Error de conexión");
      }
  };
  

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <PageLayout>
                <TopBar username={`${user?.nombre} ${user?.apellido}`} onLogout={() => navigate("/login")} />
                <div className="mt-6 px-4 max-w-6xl mx-auto flex justify-end">
                    <button
                        onClick={() => setMostrarFiltros((prev) => !prev)}
                        className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        {mostrarFiltros ? "Ocultar filtros" : "Mostrar filtros"}
                    </button>
                </div>

                {mostrarFiltros && (
                    <div className="mt-4 px-4 max-w-6xl mx-auto">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Explorar oportunidades</h2>
                        <SearchFilters
                            onBuscar={async (filtros) => {
                                const queryParams = new URLSearchParams(filtros).toString();
                                try {
                                    const res = await fetch(`${API_URL}/api/ofertas-filtradas?${queryParams}`, {
                                        credentials: "include"
                                    });
                                    const data = await res.json();
                                    console.log("📦 Ofertas filtradas recibidas:", data);
                                    if (res.ok) {
                                        const transformadas = data.map((item) => ({
                                            id: item.id,
                                            titulo: item.nombre_oferta,
                                            empresa: item.empresa,
                                            palabrasClave: item.palabras_clave,
                                            fecha: "Reciente",
                                            postulaciones: Math.floor(Math.random() * 100),
                                        }));
                                        setOfertas(transformadas);
                                        setBusquedaConfirmada("filtros");
                                        setMensajeRecomendacion("");
                                    } else {
                                        console.error("❌ Error al buscar con filtros:", data.error);
                                    }
                                } catch (err) {
                                    console.error("❌ Error de conexión:", err);
                                }
                            }}
                        />
                    </div>
                )}



                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 px-4">
                    <div>
                    <ProfileCard
                     nombre={`${user?.nombre} ${user?.apellido}`}
                    correo={user?.correo}
                    fotoUrl={user?.fotoUrl || "https://i.pravatar.cc/150?img=12"}
                    cvUrl={cvs[0]?.url || null}
                    onEdit={() => setModalEditarPerfilOpen(true)}
                    />
                        <div className="mt-3">
                            <div className="flex flex-col gap-2 mt-4">
                                <label htmlFor="cv-upload" className="flex items-center justify-center gap-2 p-2 border border-dashed border-blue-500 rounded cursor-pointer bg-blue-50 hover:bg-blue-100 transition">
                                    <FileUp className="w-4 h-4 text-blue-600" /> Subir CV
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

                             <div className="mt-4">
                                    <button
                                onClick={() => navigate("/pagos")}
                                    className="block w-full text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                                >
                                 ¿Tienes una empresa? Suscribite acá
                                </button>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                {busquedaConfirmada.trim().length >= 3 ? "Resultados de búsqueda" : "Ofertas recomendadas"}
                            </h2>
                            <div className="relative group flex gap-2 items-center">
    <input
        type="text"
        placeholder="Buscar..."
        onKeyDown={(e) => {
            if (e.key === "Enter") {
                setBusquedaConfirmada(e.target.value);
            }
        }}
        className="w-40 group-focus-within:w-60 p-2 pl-10 border border-gray-300 rounded focus:outline-none"
    />
    <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
    
    <button
        onClick={() => setBusquedaConfirmada(document.querySelector("input[placeholder='Buscar...']").value)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
        Buscar
    </button>
</div>
</div>

                        {mensajeRecomendacion ? (
                            <motion.div>
                                <p className="text-gray-600 text-base">{mensajeRecomendacion}</p>
                            </motion.div>
                        ) : (
                            ofertas.map((oferta, index) => (
                                <motion.div
                                    key={`oferta-${oferta.id ?? index}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                >
                                    <JobCard
                                        {...oferta}
                                        onPostularse={() => {
                                            setIdOfertaSeleccionada(oferta.id);
                                            setModalOpen(true);
                                        }}
                                    />
                                </motion.div>
                            ))
                        )}

                    </div>
                </div>

                {modalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
                            <h2 className="text-lg font-semibold">Postularse a la oferta</h2>

                            <label className="block text-sm text-gray-600 mb-1">Seleccioná un CV</label>
                            <div className="space-y-2">
                                {cvs.slice(0, 3).map((cv) => (
                                    <div
                                        key={cv.id}
                                        onClick={() => setCvSeleccionado(cv.id)}
                                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition w-full ${cvSeleccionado === cv.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="w-10 h-12 bg-red-500 text-white font-bold flex items-center justify-center rounded-sm text-sm mr-4 shadow">
                                            PDF
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-medium leading-tight">{cv.nombre_archivo || 'CV sin nombre'}</p>
                                            <p className="text-xs text-gray-500">{new Date(cv.fecha_subida).toLocaleDateString()}</p>
                                        </div>
                                        {cvSeleccionado === cv.id && (
                                            <div className="text-blue-600 text-lg font-bold">✓</div>
                                        )}
                                    </div>
                                ))}
                                {cvs.length === 0 && (
                                    <p className="text-sm text-gray-500">No tenés CVs cargados aún.</p>
                                )}
                            </div>


                            <label className="block text-sm text-gray-600 mt-4">Salario pretendido (opcional)</label>
                            <input
                                type="number"
                                placeholder="Ej: 1200"
                                className="w-full p-2 border border-gray-300 rounded"
                                value={salarioPretendido}
                                onChange={(e) => setSalarioPretendido(e.target.value)}
                            />

                            <div className="flex justify-end gap-2 mt-5">
                                <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
                                <button onClick={handlePostularse} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar</button>
                            </div>
                        </div>
                    </div>
                )}

{modalEditarPerfilOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
      <h2 className="text-lg font-semibold">Editar perfil</h2>

      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Nombre"
      />
      <input
        type="text"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Apellido"
      />
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Username"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
        className="w-full p-2"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setModalEditarPerfilOpen(false)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancelar
        </button>
        <button
          onClick={handleImageUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  </div>
)}


            </PageLayout>
        </motion.div>
    );
}
