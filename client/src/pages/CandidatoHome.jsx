import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CandidatoEmptyOfertas } from "../components/CandidatoEmptyOfertas.jsx";
import { ExpiredSession } from "../components/ExpiredSession.jsx";
import { JobCard } from "../components/JobCard";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";
import PageLayout from "../components/PageLayoutCand";
import PostulacionesCandidatoModal from "../components/PostulacionesCandidatoModal";
import { SearchFiltersCandidato } from "../components/SearchFiltersCandidato.jsx";
import { TopBar } from "../components/TopBarCand";

const API_URL = import.meta.env.VITE_API_URL;

export default function CandidatoHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
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
  const [modalImageFile, setModalImageFile] = useState(null);
  const [isPostulacionesModalOpen, setIsPostulacionesModalOpen] =
    useState(false);
  const [isPostulando, setIsPostulando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, cvRes] = await Promise.all([
          fetch(`${API_URL}/api/info-candidato`, { credentials: "include" }),
          fetch(`${API_URL}/api/mis-cvs`, { credentials: "include" }),
        ]);

        if (!userRes.ok) throw new Error("Error al obtener usuario");
        if (!cvRes.ok) throw new Error("Error al obtener CVs");

        const userData = await userRes.json();
        const normalized = {
          ...userData,
          fotoUrl: userData.foto_url,
        };
        console.log("Username:", normalized.username);
        setUser(normalized);

        const cvsData = await cvRes.json();

        setCvs(cvsData);
        setCvSeleccionado(cvsData[0]?.id || null);
        fetchRecomendaciones();

        setNombre(normalized.nombre);
        setApellido(normalized.apellido);
        setUsername(normalized.username);
      } catch (err) {
        console.error("Error en fetchData:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchRecomendaciones = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recomendaciones`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.error?.includes("no tiene un CV cargado")) {
            setMensajeRecomendacion(
              "Subí un CV para recibir recomendaciones personalizadas."
            );
            setOfertas([]);
            setLoading(false);
            return;
          } else {
            throw new Error(
              data.error || "Error desconocido en recomendaciones"
            );
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
        console.error("Error en fetchRecomendaciones:", err);
        setMensajeRecomendacion(
          "No pudimos obtener recomendaciones en este momento. Vuelve a intentarlo más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const Toast = ({ message, type, onClose }) => (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`fixed top-5 right-5 z-[9999] p-4 rounded-lg shadow-md flex items-center gap-2 max-w-sm w-fit ${
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      <span>{message}</span>
      <button className="ml-2 text-lg" onClick={onClose}>
        ×
      </button>
    </motion.div>
  );

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const fetchTodasLasOfertas = async () => {
      const term = busquedaConfirmada.trim();
      if (term.length < 3) return;

      try {
        const res = await fetch(`${API_URL}/api/todas-las-ofertas`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          const todas = data
            .filter(
              (item) =>
                item.nombre_oferta.toLowerCase().includes(term.toLowerCase()) ||
                item.palabras_clave.some((p) =>
                  p.toLowerCase().includes(term.toLowerCase())
                )
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
          console.error("Error en todas-las-ofertas:", data.error);
        }
      } catch (err) {
        console.error("Error al buscar todas las ofertas:", err);
      }
    };

    fetchTodasLasOfertas();
  }, [busquedaConfirmada]);

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cerrar sesión");
        navigate("/");
      })
      .catch((err) => console.error("Error al cerrar sesión:", err));
  };

  useEffect(() => {
    const handleToastEvent = (e) => {
      addToast(e.detail); // muestra el mensaje recibido
    };

    window.addEventListener("cvSubidoOk", handleToastEvent);
    return () => window.removeEventListener("cvSubidoOk", handleToastEvent);
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
        addToast("¡CV subido exitosamente!", "success");
        setCvFile(null);
        setCvPreview(null);
        window.location.reload();
      } else {
        addToast("Error: " + (result.error || "desconocido"), "error");
      }
    } catch (error) {
      addToast("Error de conexión al subir CV", "error");
    }
  };

  const handlePostularse = async () => {
    if (!cvSeleccionado) {
      return addToast("Elegí un CV para completar tu postulación", "error");
    }
    setIsPostulando(true);
    try {
      const res = await fetch(
        `${API_URL}/api/postularme/${idOfertaSeleccionada}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_cv: cvSeleccionado,
            salario_pretendido: salarioPretendido || null,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        addToast("Postulación realizada con éxito", "success");
        setModalOpen(false);
        setSalarioPretendido("");
      } else {
        addToast("Error: " + (data.error || "desconocido"), "error");
      }
    } catch (err) {
      addToast("Error de conexión al postularse", "error");
    } finally {
      setIsPostulando(false);
    }
  };

  const ofertasFiltradas = ofertas
    .filter(
      (o) =>
        o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.palabrasClave.some((p) =>
          p.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
    .sort((a, b) => b.coincidencia - a.coincidencia);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">
          Obteniendo información, por favor espera...
        </div>
      </div>
    );
  }

  const handleImageUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/subir-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        addToast("Imagen subida exitosamente", "success");
        setUser((prev) => ({ ...prev, fotoUrl: result.file_path }));
        setModalEditarPerfilOpen(false);
      } else {
        addToast("Error: " + (result.error || "desconocido"), "error");
      }
    } catch (err) {
      addToast("Error de conexión", "error");
    }
  };

  const handleProfileUpdate = async ({
    nombre,
    apellido,
    username,
    email,
    password,
  }) => {
    try {
      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Error al actualizar perfil");
      setUser((prev) => ({
        ...prev,
        username: result.username,
        correo: result.email,
      }));
      setModalEditarPerfilOpen(false);
      addToast("Perfil actualizado correctamente.", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  if(error){
    return <ExpiredSession />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <PageLayout>
        <TopBar
          username={`${user?.nombre} ${user?.apellido}`}
          user={user}
          onLogout={handleLogout}
          onEditPerfil={() => setModalEditarPerfilOpen(true)}
          onPostulacion={() => setIsPostulacionesModalOpen(true)}
        />
        <div className="mt-6 px-4 max-w-6xl mx-auto flex justify-end">
          <button
            onClick={() => setMostrarFiltros((prev) => !prev)}
            className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            {mostrarFiltros ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            />
          ))}
        </AnimatePresence>

        {mostrarFiltros && (
          <div className="mt-4 px-4 max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Explorar oportunidades
            </h2>
            <SearchFiltersCandidato
              onBuscar={async (filtros) => {
                const queryParams = new URLSearchParams(filtros).toString();
                try {
                  const res = await fetch(
                    `${API_URL}/api/ofertas-filtradas?${queryParams}`,
                    {
                      credentials: "include",
                    }
                  );
                  const data = await res.json();
                  console.log("ofertas filtradas recibidas:");
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
                    console.error("Error al buscar con filtros:", data.error);
                  }
                } catch (err) {
                  console.error("Error de conexión:", err);
                }
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6 px-4">
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {busquedaConfirmada.trim().length >= 3
                  ? "Resultados de búsqueda"
                  : "Ofertas recomendadas"}
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
                  onClick={() =>
                    setBusquedaConfirmada(
                      document.querySelector("input[placeholder='Buscar...']")
                        .value
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Buscar
                </button>
              </div>
            </div>

            {mensajeRecomendacion ? (
              <CandidatoEmptyOfertas />
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
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold">Postularse a la oferta</h2>

              <label className="block text-sm text-gray-600 mb-1">
                Seleccioná un CV
              </label>
              <div className="space-y-2">
                {cvs.slice(0, 3).map((cv) => (
                  <div
                    key={cv.id}
                    onClick={() => setCvSeleccionado(cv.id)}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition w-full ${
                      cvSeleccionado === cv.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-10 h-12 bg-red-500 text-white font-bold flex items-center justify-center rounded-sm text-sm mr-4 shadow">
                      PDF
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium leading-tight">
                        {" "}
                        {cv.url
                          .split("/")
                          .pop()
                          .split("_")
                          .slice(0, -1)
                          .join("_")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(cv.fecha_subida).toLocaleDateString()}
                      </p>
                    </div>
                    {cvSeleccionado === cv.id && (
                      <div className="text-blue-600 text-lg font-bold">✓</div>
                    )}
                  </div>
                ))}
                {cvs.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Aún no has cargado un CV. Subí uno para acceder a más
                    oportunidades.
                  </p>
                )}
              </div>

              <label className="block text-sm text-gray-600 mt-4">
                Salario pretendido (opcional)
              </label>
              <input
                type="number"
                placeholder="Ej: 1200"
                className="w-full p-2 border border-gray-300 rounded"
                value={salarioPretendido}
                onChange={(e) => setSalarioPretendido(e.target.value)}
              />

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePostularse}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isPostulando}
                >
                  {isPostulando ? "Enviando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ModalParaEditarPerfil
          isOpen={modalEditarPerfilOpen}
          onClose={() => setModalEditarPerfilOpen(false)}
          user={user}
          onSave={async ({ username, email, password }) => {
            await handleProfileUpdate({ username, email, password });
            if (modalImageFile) await handleImageUpload(modalImageFile);
          }}
          onFileSelect={setModalImageFile}
        />

        <PostulacionesCandidatoModal
          isOpen={isPostulacionesModalOpen}
          onClose={() => setIsPostulacionesModalOpen(false)}
        />
      </PageLayout>
    </motion.div>
  );
}
