import { motion } from "framer-motion";
import {
  File,
  FileLock,
  FileSearchIcon,
  FileText,
  FileUp,
  Search,
  SquareChartGanttIcon,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AccionesSinSeccion } from "../components/AccionesSinSeccion";
import { EncuestasPendientesModal } from "../components/EncuestaModal/EncuestasPendientes/EncuestasPendientesModal";
import { EncuestasRespondidasModal } from "../components/EncuestaModal/EncuestasRespondidas/EncuestasRespondidasModal";
import { GestionarEncuestasModal } from "../components/EncuestaModal/GestionarEncuesta/GestionarEncuestasModal.jsx";
import { ExpiredSession } from "../components/ExpiredSession.jsx";
import { GestionarDesempeñoEmpleadosModal } from "../components/GestionarDesempeñoEmpleadosModal";
import { LicenciasModal } from "../components/LicenciasModal";
import { ModalEncuesta } from "../components/ModalEncuesta";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil";
import { OfertasRecomendadas } from "../components/OfertasRecomendadas";
import PageLayout from "../components/PageLayoutCand";
import { PostulacionesModal } from "../components/PostulacionesModal";
import { PostularseModal } from "../components/PostularseModal";
import { SearchFilters } from "../components/SearchFilters";
import { SolicitarLicenciaModal } from "../components/SolicitarLicenciaModal";
import { Toast } from "../components/Toast.jsx";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { useOfertasRecomendadas } from "../hooks/useOfertasRecomendadas";
import { authService } from "../services/authService";
import { empleadoService } from "../services/empleadoService";

const jefeRoles = [
  "Jefe de Tecnología y Desarrollo",
  "Jefe de Administración y Finanzas",
  "Jefe Comercial y de Ventas",
  "Jefe de Marketing y Comunicación",
  "Jefe de Industria y Producción",
  "Jefe de Servicios Generales y Gastronomía",
];

export default function EmpleadoHome() {
  const [modalEditarPerfilOpen, setModalEditarPerfilOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [cvPreview, setCvPreview] = useState(null);
  const [idOfertaSeleccionada, setIdOfertaSeleccionada] = useState(null);
  const [cvSeleccionado, setCvSeleccionado] = useState(null);
  const [busquedaConfirmada, setBusquedaConfirmada] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const [modalEncuesta, setModalEncuesta] = useState(false);
  const [modalGestionEncuestas, setModalGestionEncuestas] = useState(false);
  const [modalVerEncuesta, setModalVerEncuesta] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
  const [modalEncuestasRespondidas, setModalEncuestasRespondidas] =
    useState(false);
  const [encuestasRespondidas, setEncuestasRespondidas] = useState([]);
  const [modalEncuestasPendientes, setModalEncuestasPendientes] =
    useState(false);

  // Estados typeados porque son asíncronos
  /** @type {[Usuario]} */
  const [user, setUser] = useState(null);
  /** @type {[CV[]]} */
  const [cvs, setCvs] = useState([]);

  // Modales
  const [modalPostulaciones, setModalPostulaciones] = useState(false);
  const [modalSolicitarLicencia, setmodalSolicitarLicencia] = useState(false);
  const [modalLicencias, setModalLicencias] = useState(false);
  const [modalEditarPefil, setModalEditarPerfil] = useState(false);
  const [modalImageFile, setModalImageFile] = useState(null);
  const [modalGestionarDesempeño, setModalGestionarDesempeño] = useState(false);

  // Custom Hooks
  const { ofertas, ofertasIsLoading, ofertasError, handlerAplicarFiltros } =
    useOfertasRecomendadas();
  const navigate = useNavigate();
  const preferencias = useEmpresaEstilos(user?.id_empresa);

  const estilos = {
    color_principal: preferencias.estilos?.color_principal ?? "#2563eb",
    color_secundario: preferencias.estilos?.color_secundario ?? "#f3f4f6",
    color_texto: preferencias.estilos?.color_texto ?? "#000000",
    slogan: preferencias.estilos?.slogan ?? "Bienvenido al panel de Empleado",
    logo_url: preferencias.estilos?.logo_url ?? null,
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

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const showToast = useCallback(
    (message, type = "success", autoClose = true) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, message, type, autoClose }]);

      if (autoClose) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return <ExpiredSession />;
  }

  const handleProfileUpdate = async ({
    nombre,
    apellido,
    username,
    email,
    password,
  }) => {
    try {
      const result = await authService.updateProfile({
        email,
        password,
        username,
      });
      console.log({result});
      
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

  const acciones = [
    {
      icon: FileUp,
      titulo: "Solicitar Licencia",
      descripcion: "Solicitá una nueva licencia.",
      onClick: () => setmodalSolicitarLicencia(true),
    },
    {
      icon: FileSearchIcon,
      titulo: "Ver Mis Licencias",
      descripcion: "Accedé al listado de tus licencias.",
      onClick: () => setModalLicencias(true),
    },
    {
      icon: SquareChartGanttIcon,
      titulo: "Ver estado de mis postulaciones",
      descripcion: "Accedé al listado de tus postulaciones.",
      onClick: () => setModalPostulaciones(true),
    },
    jefeRoles.includes(user.puesto_trabajo) && {
      icon: SquareChartGanttIcon,
      titulo: "Asignar desempeño",
      descripcion: "Gestioná el desempeño de los empleados de tu área.",
      onClick: () => setModalGestionarDesempeño(true),
    },
    jefeRoles.includes(user.puesto_trabajo) && {
      icon: FileLock,
      titulo: "Crear Encuesta",
      descripcion: "Diseñá encuestas para obtener feedback del personal.",
      onClick: () => setModalEncuesta(true),
    },
    jefeRoles.includes(user.puesto_trabajo) && {
      icon: FileText,
      titulo: "Gestionar Encuestas",
      descripcion: "Administrá las encuestas creadas y sus resultados.",
      onClick: () => setModalGestionEncuestas(true),
    },
    {
      icon: FileSearchIcon,
      titulo: "Encuestas Pendientes",
      descripcion: "Consultá encuestas que aún no fueron respondidas.",
      onClick: () => setModalEncuestasPendientes(true),
    },
    {
      icon: FileText,
      titulo: "Encuestas Respondidas",
      descripcion: "Revisá las respuestas de encuestas completadas.",
      onClick: () => setModalEncuestasRespondidas(true),
    },
  ].filter(Boolean);

  const handleUploadCv = () => {
    empleadoService
      .subirCV({ file: cvFile })
      .then(() => {
        toast.success("¡CV subido exitosamente!")
        setCvPreview(null);
        setCvFile(null);
        window.location.reload();
      })
      .catch(() => {
        toast.error("Error de conexión al subir CV")
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

  const handleUpdateProfile = ({ email, username, password }) => {
    authService
      .updateProfile({ email, username, password })
      .then(() => {
        setModalEditarPerfil(false);
      })
      .catch((err) => console.log(err.message));
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    empleadoService
      .subirImagen({ file })
      .then((result) => {
        alert("Imagen subida exitosamente");
        setUser((prev) => ({ ...prev, foto_url: result.file_path }));
        setModalEditarPerfil(false);
      })
      .catch((err) => {
        alert("Error: " + (err.message || "desconocido"));
      });
  };

  return (
    <EstiloEmpresaContext.Provider value={{ estilos }}>
      <Toast toasts={toasts} removeToast={removeToast} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <PageLayout>
          <TopBar
            onEditPerfil={() => setModalEditarPerfilOpen(true)}
            username={`${user?.nombre} ${user?.apellido}`}
            onLogout={handleLogout}
          />
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
              <div className="mt-3">
                {cvs.length > 0 && (
                  <div>
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
                  </div>
                )}
                <div
                  className="flex flex-col gap-2 mt-4"
                  style={{
                    color: estilos.color_principal,
                    borderColor: estilos.color_principal,
                  }}
                >
                  <label
                    style={{ backgroundColor: estilos.color_secundario }}
                    htmlFor="cv-upload"
                    className="flex items-center justify-center gap-2 p-2 border border-dashed rounded cursor-pointer hover:bg-indigo-100 transition"
                  >
                    <FileUp className="w-4 h-4" /> Subir Currículum Vitae
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
                  <h2 className="text-lg font-semibold text-black my-4">
                    Acciones disponibles: Empleado
                  </h2>
                  <AccionesSinSeccion acciones={acciones} estilos={estilos} />
                </motion.div>
              </div>
            </div>
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {busquedaConfirmada.trim().length >= 3
                    ? "Resultados de búsqueda"
                    : "Ofertas Filtradas"}
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
              {
                cvs.length ?
                <OfertasRecomendadas
                  onSelectOferta={(id) => setIdOfertaSeleccionada(id)}
                  isLoading={ofertasIsLoading}
                  error={ofertasError}
                  ofertas={ofertasFiltradas}
                />
                 : <section className="flex flex-col items-center gap-4 p-12 relative">
                  <div className="flex opacity-50">
                  <File className="translate-x-5 -rotate-12 size-14 "/>
                  <File className="-translate-x-2 rotate-12 size-14 fill-white"/>
                  </div>
                  <p className="bg-gradient-to-b from-transparent via-white to-transparent p-2">Sube un CV para obtener recomendaciones</p>
                 </section>
              }
            </div>
          </div>

          {modalLicencias && (
            <LicenciasModal
              onOpenChange={setModalLicencias}
              open={modalLicencias}
              service={empleadoService}
            />
          )}

          {modalSolicitarLicencia && (
            <SolicitarLicenciaModal
              open={modalSolicitarLicencia}
              onOpenChange={setmodalSolicitarLicencia}
            />
          )}

          {idOfertaSeleccionada && (
            <PostularseModal
              onClose={() => setIdOfertaSeleccionada(null)}
              addToast={addToast}
              idOferta={idOfertaSeleccionada}
              cvs={cvs}
            />
          )}

          {modalPostulaciones && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setModalPostulaciones(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <PostulacionesModal
                  onClose={() => setModalPostulaciones(false)}
                />
              </div>
            </div>
          )}

          {modalGestionarDesempeño && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setModalGestionarDesempeño(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <GestionarDesempeñoEmpleadosModal
                  onOpenChange={setModalGestionarDesempeño}
                  open={modalGestionarDesempeño}
                />
              </div>
            </div>
          )}

          <ModalParaEditarPerfil
            isOpen={modalEditarPefil}
            onClose={() => setModalEditarPerfil(false)}
            user={user}
            onSave={({ username, email, password }) => {
              handleUpdateProfile({ username, email, password });
              if (modalImageFile) handleImageUpload(modalImageFile);
            }}
            onFileSelect={setModalImageFile}
          />

          {modalEncuesta && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setModalEncuesta(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <ModalEncuesta
                  open={modalEncuesta}
                  onOpenChange={setModalEncuesta}
                />
              </div>
            </div>
          )}

          {modalGestionEncuestas && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setModalGestionEncuestas(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <GestionarEncuestasModal
                  open={modalGestionEncuestas}
                  onOpenChange={setModalGestionEncuestas}
                />
              </div>
            </div>
          )}

          {modalEncuestasPendientes && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setModalEncuestasPendientes(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <EncuestasPendientesModal
                  open={modalEncuestasPendientes}
                  onOpenChange={setModalEncuestasPendientes}
                />
              </div>
            </div>
          )}

          {modalEncuestasRespondidas && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setModalEncuestasRespondidas(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <EncuestasRespondidasModal
                  open={modalEncuestasRespondidas}
                  onOpenChange={setModalEncuestasRespondidas}
                  encuestas={encuestasRespondidas}
                />
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
        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}
