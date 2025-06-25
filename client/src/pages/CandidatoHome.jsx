import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Sparkles, TextSearch } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CandidatoEmptyOfertas } from "../components/CandidatoEmptyOfertas.jsx";
import { ExpiredSession } from "../components/ExpiredSession.jsx";
import { JobCard } from "../components/JobCard";
import { JobCardSkeleton } from "../components/JobCardSkeleton.js";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";
import PageLayout from "../components/PageLayoutCand";
import PostulacionesCandidatoModal from "../components/PostulacionesCandidatoModal";
import { SearchFiltersCandidato } from "../components/SearchFiltersCandidato.jsx";
import { TopBar } from "../components/TopBarCand";
import { Button } from "../components/shadcn/Button.jsx";
import { candidatoService } from "../services/candidatoService.js";

const API_URL = import.meta.env.VITE_API_URL;

export default function CandidatoHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ofertas, setOfertas] = useState([]);
  const [cvs, setCvs] = useState([]);
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
  const [mostrarRecomendaciones, setMostrarRecomendaciones] = useState(true);
  const searchRef = useRef(null)

  const ofertasRecomendadas = useQuery({
    queryKey: ["ofertas-recomendadas"],
    queryFn: () =>
      candidatoService.obtenerRecomendaciones().then((data) => {
        console.log({ data });

        const transformadas = data.map((item) => ({
          id: item.id_oferta,
          titulo: item.nombre_oferta,
          empresa: item.empresa,
          coincidencia: item.coincidencia,
          palabrasClave: item.palabras_clave,
          fecha: "Reciente",
          postulaciones: Math.floor(Math.random() * 100),
        }));
        return transformadas;
      }),
  });

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
        // fetchRecomendaciones();
        fetchTodasLasOfertas();

        setNombre(normalized.nombre);
        setApellido(normalized.apellido);
        setUsername(normalized.username);
      } catch (err) {
        console.error("Error en fetchData:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchTodasLasOfertas = async () => {
    setLoadingOfertasRecomendadas(true);
    candidatoService
      .obtenerTodasLasOfertas()
      .then((data) => {
        const todas = data.map((item) => ({
          id: item.id,
          titulo: item.nombre_oferta,
          empresa: item.empresa,
          palabrasClave: item.palabras_clave,
          fecha: "Reciente",
          postulaciones: Math.floor(Math.random() * 100),
        }));
        setOfertas(todas);
      })
      .catch((error) => {
        console.error({ error });
        setMensajeRecomendacion(
          "Subí un CV para recibir recomendaciones personalizadas."
        );
      })
      .finally(() => setLoading(false));
  };

  const handleFilterByName = (e)=> {
    e.preventDefault()
    const newSearchTerm = searchRef.current.value;
    setSearchTerm(newSearchTerm);  
  }

  const ofertasRecomendadasFiltradas = ofertasRecomendadas.data?.filter(
    (item) => item.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ofertasFiltradas = ofertas.filter((item) =>
    item.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handlePostularse = async () => {
    if (!cvSeleccionado) {
      toast.error("Elegí un CV para completar tu postulación");
      return;
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
        toast.success("Postulación realizada con éxito");
        setModalOpen(false);
        setSalarioPretendido("");
      } else {
        toast.error("Error: " + (data.error || "desconocido"));
      }
    } catch (err) {
      console.error({ err });
      toast.error("Error de conexión al postularse");
    } finally {
      setIsPostulando(false);
    }
  };

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
        toast.success("Imagen subida exitosamente");
        setUser((prev) => ({ ...prev, fotoUrl: result.file_path }));
        setModalEditarPerfilOpen(false);
      } else {
        toast.error("Error: " + (result.error || "desconocido"));
      }
    } catch (err) {
      console.error({ err });
      toast.error("Error de conexión");
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
      toast.success("Perfil actualizado correctamente.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (error) {
    return <ExpiredSession />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <PageLayout>
        <TopBar
          cvs={cvs ?? []}
          username={`${user?.nombre} ${user?.apellido}`}
          user={user}
          onLogout={handleLogout}
          onEditPerfil={() => setModalEditarPerfilOpen(true)}
          onPostulacion={() => setIsPostulacionesModalOpen(true)}
        />
        <header className="mt-6 px-4 max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              onClick={() => setMostrarRecomendaciones(true)}
              variant={mostrarRecomendaciones ? "default" : "outline"}
            >
              Recomendaciones <Sparkles />
            </Button>
            <Button
              onClick={() => setMostrarRecomendaciones(false)}
              variant={!mostrarRecomendaciones ? "default" : "outline"}
            >
              Explorar ofertas <TextSearch />
            </Button>
          </div>
          <button
            onClick={() => setMostrarFiltros((prev) => !prev)}
            className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            {mostrarFiltros ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </header>

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
            <section className="flex flex-col gap-8">
              <header className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {busquedaConfirmada.trim().length >= 3
                    ? "Resultados de búsqueda"
                    : "Ofertas recomendadas"}
                </h2>
                <form onSubmit={handleFilterByName} className="relative group flex gap-2 items-center">
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Buscar..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setBusquedaConfirmada(e.target.value);
                      }
                    }}
                    className="w-40 group-focus-within:w-60 p-[6px] pl-10 border border-gray-300 rounded-md focus:outline-none"
                  />
                  <Search className="absolute left-2 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  <Button
                    className="h-full"
                  >
                    Buscar
                  </Button>
                </form>
              </header>
              {mostrarRecomendaciones ? (
                mensajeRecomendacion ? (
                  <CandidatoEmptyOfertas />
                ) : ofertasRecomendadas.isLoading ? (
                  <JobCardSkeleton />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {ofertasRecomendadasFiltradas?.map((oferta, index) => (
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
                    ))}
                  </ul>
                )
              ) : loading ? (
                <JobCardSkeleton />
              ) : (
                <ul className="flex flex-col gap-2">
                  {ofertasFiltradas.map((oferta, index) => (
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
                  ))}
                </ul>
              )}
            </section>
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
