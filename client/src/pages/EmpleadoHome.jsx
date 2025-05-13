import { motion } from "framer-motion";
import { FileSearchIcon, FileUp, Search, SquareChartGanttIcon, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LicenciasModal } from "../components/LicenciasModal";
import { OfertasRecomendadas } from "../components/OfertasRecomendadas";
import PageLayout from "../components/PageLayoutCand";
import { PostulacionesModal } from "../components/PostulacionesModal";
import { PostularseModal } from "../components/PostularseModal";
import { ProfileCard } from "../components/ProfileCard";
import { SearchFilters } from "../components/SearchFilters";
import { SolicitarLicenciaModal } from "../components/SolicitarLicenciaModal";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { useOfertasRecomendadas } from "../hooks/useOfertasRecomendadas";
import { authService } from "../services/authService";
import { empleadoService } from "../services/empleadoService";

export default function EmpleadoHome() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [cvPreview, setCvPreview] = useState(null);
  const [idOfertaSeleccionada, setIdOfertaSeleccionada] = useState(null);
  const [cvSeleccionado, setCvSeleccionado] = useState(null);
  const [busquedaConfirmada, setBusquedaConfirmada] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados typeados porque son asíncronos
  /** @type {[Usuario]} */
  const [user, setUser] = useState(null);
  /** @type {[CV[]]} */
  const [cvs, setCvs] = useState([]);

  // Modales
  const [modalPostulaciones, setModalPostulaciones] = useState(false);
  const [modalSolicitarLicencia, setmodalSolicitarLicencia] = useState(false);
  const [modalLicencias, setModalLicencias] = useState(false);

  const { ofertas, ofertasIsLoading, ofertasError, handlerAplicarFiltros } =
    useOfertasRecomendadas();
  const { estilos } = useEmpresaEstilos(user?.id_empresa);
  const navigate = useNavigate();

  const ofertasFiltradas = ofertas
    .filter(
      (o) =>
        o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.palabrasClave.some((p) =>
          p.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
    .sort((a, b) => b.coincidencia - a.coincidencia);

  useEffect(() => {
    // Cargar informacion del usuario
    setLoading(true);

    authService
      .obtenerInfoUsuario()
      .then(setUser)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Cargar cvs
    empleadoService
      .obtenerMisCvs()
      .then(setCvs)
      .catch((err) => {
        console.error(err.message);
      });
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
      icon: FileSearchIcon,
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
    {
      icon: SquareChartGanttIcon,
      titulo: "Ver estado de mis postulaciones",
      descripcion: "Accede al listado de tus postulaciones.",
      onClick: () => setModalPostulaciones(true),
    },
  ];

  const handleUploadCv = () => {
    empleadoService
      .subirCV({ file: cvFile })
      .then(() => {
        setCvPreview(null);
        setCvFile(null);
      })
      .catch(() => {
        console.log("ERROR AL SUBIR EL CV");
      });
  };

  const handleLogout = () => {
    authService
      .logout()
      .then(() => {
        navigate("/login");
      })
      .catch((err) => console.error("Error al cerrar sesión:", err));
  };

  return (
    <EstiloEmpresaContext.Provider value={{ estilos }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <PageLayout>
          <TopBar
            username={`${user?.nombre} ${user?.apellido}`}
            onLogout={handleLogout}
          />
          <div className="px-4 py-6">
            <div
              className="mx-auto w-fit text-sm font-medium px-4 py-2 rounded-full border shadow-sm"
              style={{
                backgroundColor: estilos.color_secundario,
                borderColor: estilos.color_principal,
                color: estilos.color_texto,
              }}
            >
              {estilos.slogan}
            </div>
          </div>

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
                onBuscar={(filtros) => handlerAplicarFiltros(filtros)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 px-4">
            <div>
              <ProfileCard
                nombre={`${user?.nombre} ${user?.apellido}`}
                correo={user?.correo}
                fotoUrl={
                  user?.fotoUrl ||
                  "https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"
                }
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
                <div className="flex flex-col gap-2 mt-4" style={{ color: estilos.color_principal, borderColor: estilos.color_principal }}>
                  <label
                    style={{backgroundColor: estilos.color_secundario}}
                    htmlFor="cv-upload"
                    className="flex items-center justify-center gap-2 p-2 border border-dashed rounded cursor-pointer hover:bg-indigo-100 transition"
                  >
                    <FileUp className="w-4 h-4" /> Seleccionar archivo
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
                      onClick={handleUploadCv}
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
                            backgroundColor: estilos.color_secundario,
                            borderColor: estilos.color_principal,
                            color: estilos.color_texto,
                          }}
                        >
                          <Icon
                            className="w-6 h-6 mb-2"
                            style={{ color: estilos.color_principal }}
                          />
                          <h3
                            className="text-base font-semibold"
                            style={{ color: estilos.color_texto }}
                          >
                            {titulo}
                          </h3>
                          <p
                            className="text-sm mt-1"
                            style={{ color: estilos.color_texto }}
                          >
                            {descripcion}
                          </p>
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
                    : "Ofertas rofertasFiltradas"}
                </h2>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
              <OfertasRecomendadas
                onSelectOferta={(id) => setIdOfertaSeleccionada(id)}
                isLoading={ofertasIsLoading}
                error={ofertasError}
                ofertas={ofertasFiltradas}
              />
            </div>
          </div>

          {modalLicencias && (
            <LicenciasModal onClose={() => setModalLicencias(false)} />
          )}

          {modalSolicitarLicencia && (
            <SolicitarLicenciaModal
              onClose={() => setmodalSolicitarLicencia(false)}
            />
          )}

          {idOfertaSeleccionada && (
            <PostularseModal
              onClose={() => setIdOfertaSeleccionada(null)}
              idOferta={idOfertaSeleccionada}
              cvs={cvs}
            />
          )}

          {modalPostulaciones && (
            <PostulacionesModal onClose={() => setModalPostulaciones(false)} />
          )}
        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}
