import { motion } from "framer-motion";
import { FileUp, Search, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LicenciasModal } from "../components/LicenciasModal";
import PageLayout from "../components/PageLayoutCand";
import { ProfileCard } from "../components/ProfileCard";
import { SearchFilters } from "../components/SearchFilters";
import { SolicitarLicenciaModal } from "../components/SolicitarLicenciaModal";
import { TopBar } from "../components/TopBarCand";
import {
  EstiloEmpresaContext,
  useEstiloEmpresa,
} from "../context/EstiloEmpresaContext";
import { authService } from "../services/authService";
import { empleadoService } from "../services/empleadoService";

const API_URL = import.meta.env.VITE_API_URL;

export default function CandidatoEmpHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ofertas, setOfertas] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [cvPreview, setCvPreview] = useState(null);
  const [idOfertaSeleccionada, setIdOfertaSeleccionada] = useState(null);
  const [cvSeleccionado, setCvSeleccionado] = useState(null);
  const [busquedaConfirmada, setBusquedaConfirmada] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Modales
  const [modalSolicitarLicencia, setmodalSolicitarLicencia] = useState(false);
  const [modalLicencias, setModalLicencias] = useState(false);

  const { estilos: estilosSafe } = useEstiloEmpresa();
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar informacion del usuario
    setLoading(true)

    authService.obtenerInfoUsuario()
    .then(setUser)
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false))

    // Cargar ofertas de la empresa perteneciente al empleado
    empleadoService.obtenerOfertasEmpresa()
    .then(setOfertas)
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">Error al cargar el perfil</div>
      </div>
    );
  }

  const acciones = [
    {
      icon: FileUp,
      titulo: "Ver Mis Licencias",
      descripcion: "Accede al listado tus licencias.",
      onClick: () => setModalLicencias(true),
    },
    {
      icon: FileUp,
      titulo: "Solicitar Licencia",
      descripcion: "Solicituar una nueva licencia.",
      onClick: () => setmodalSolicitarLicencia(true),
    },
  ];

  return (
    <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <PageLayout>
          <TopBar
            username={`${user?.nombre} ${user?.apellido}`}
            onLogout={() => navigate("/login")}
          />
          <div className="mt-6 px-4 max-w-6xl mx-auto flex justify-end">
            <button
              onClick={() => setMostrarFiltros((prev) => !prev)}
              className="text-sm px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              {mostrarFiltros ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
          </div>

          {mostrarFiltros && (
            <div className="mt-4 px-4 max-w-6xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Explorar oportunidades
              </h2>
              <SearchFilters
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
                    } else {
                      console.error(
                        "❌ Error al buscar con filtros:",
                        data.error
                      );
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
              />
              <div className="mt-3">
                <label className="block mb-2 text-sm text-gray-600">
                  Seleccionar CV
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={cvSeleccionado}
                  onChange={(e) => setCvSeleccionado(e.target.value)}
                >
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.nombre_archivo ||
                        new Date(cv.fecha_subida).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <div className="flex flex-col gap-2 mt-4">
                  <label
                    htmlFor="cv-upload"
                    className="flex items-center justify-center gap-2 p-2 border border-dashed border-indigo-500 rounded cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition"
                  >
                    <FileUp className="w-4 h-4 text-indigo-600" /> Seleccionar
                    archivo
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
                    <p className="text-sm text-gray-600">
                      Archivo seleccionado:{" "}
                      <span className="font-medium">{cvPreview}</span>
                    </p>
                  )}
                  {cvFile && (
                    <button
                      // onClick={handleUploadCV}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 transition"
                    >
                      <Upload className="w-4 h-4" /> Confirmar subida
                    </button>
                  )}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className=""
                >
                  <h2 className="text-lg font-semibold text-black">
                    Acciones disponibles: Empleado
                  </h2>
                  <div className="flex flex-col gap-4">
                    {acciones.map(
                      ({ icon: Icon, titulo, descripcion, onClick }, idx) => (
                        <motion.div
                          key={idx}
                          onClick={onClick}
                          className="cursor-pointer border p-5 rounded-xl shadow-sm hover:shadow-md"
                          style={{
                            backgroundColor: estilosSafe.color_secundario,
                            borderColor: estilosSafe.color_secundario,
                            color: estilosSafe.color_texto,
                          }}
                        >
                          <Icon
                            className="w-6 h-6 mb-2"
                            style={{ color: estilosSafe.color_texto }}
                          />
                          <h3 className="text-base font-semibold">{titulo}</h3>
                          <p className="text-sm mt-1">{descripcion}</p>
                        </motion.div>
                      )
                    )}
                  </div>
                </motion.div>
              </div>

            </div>
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {busquedaConfirmada.trim().length >= 3
                    ? "Resultados de búsqueda"
                    : "Ofertas recomendadas"}
                </h2>
                <div className="relative group">
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
                </div>
              </div>
              {
                ofertas?.map((oferta, index) => 
                  <motion.div
                    key={`oferta-${oferta.id ?? index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    {/*
                    Cuando tengamos el endpoint /recomendaciones para empleado se puede usar JobCard
                    Nos faltan las palabras claves
                    */}
                    <p>{oferta.nombre}</p>
                    {/* <JobCard
                      {...oferta}
                      onPostularse={() => {
                        setIdOfertaSeleccionada(oferta.id);
                        setModalOpen(true);
                      }}
                    /> */}
                  </motion.div>
                )
              }
            </div>
          </div>

          {modalLicencias && <LicenciasModal onClose={() => setModalLicencias(false)} />}

          {modalSolicitarLicencia && (
            <SolicitarLicenciaModal onClose={() => setmodalSolicitarLicencia(false)} />
          )}
        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}
