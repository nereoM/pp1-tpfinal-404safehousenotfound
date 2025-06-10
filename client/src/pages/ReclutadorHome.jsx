import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, Download, FileLock, FilePlus, FileSearchIcon, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Acciones } from "../components/Acciones.jsx";
import { LicenciasACargoModal } from "../components/LicenciasACargoModal.jsx";
import { LicenciasModal } from "../components/LicenciasModal.jsx";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";
import ModalPostulantes from '../components/ModalPostulantes';
import PageLayout from "../components/PageLayout";
import { SolicitarLicenciaModal } from "../components/SolicitarLicenciaModal.jsx";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { reclutadorService } from '../services/reclutadorService.js';
import EmpleadosRendimiento from "./EmpleadosRendimientoEmpleados";

export default function ReclutadorHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const [ofertasAsignadas, setOfertasAsignadas] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [mensajeOfertas, setMensajeOfertas] = useState("");
  const [modalOfertasOpen, setModalOfertasOpen] = useState(false);
  const [modalLicenciaOpen, setModalLicenciaOpen] = useState(false);
  const [formLicencia, setFormLicencia] = useState({ tipo: "", descripcion: "" });
  const [mensajeLicencia, setMensajeLicencia] = useState("");
  const [licencias, setLicencias] = useState([]);
  const [modalLicenciasOpen, setModalLicenciasOpen] = useState(false);
  const [licenciaId, setLicenciaId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mensajeCertificado, setMensajeCertificado] = useState("");
  const [modalEditarEtiquetasOpen, setModalEditarEtiquetasOpen] = useState(false);
  const [selectedOfertaId, setSelectedOfertaId] = useState(null);
  const [etiquetasOferta, setEtiquetasOferta] = useState([]);
  const [nuevasEtiquetas, setNuevasEtiquetas] = useState([]);
  const [mensajeEtiquetas, setMensajeEtiquetas] = useState("");
  const [modalPostulantesOpen, setModalPostulantesOpen] = useState(false);
  const [postulantes, setPostulantes] = useState([]);
  const [postulantesFiltrados, setPostulantesFiltrados] = useState([]);
  const [filtros, setFiltros] = useState({ nombre: '', email: '', is_apto: '', fecha_desde: '', fecha_hasta: '' });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [cvUrl, setCvUrl] = useState(null);
  const [modalEditarPerfilOpen, setModalEditarPerfilOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [username, setUsername] = useState("");
  const [modalImageFile, setModalImageFile] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  const [estadoPostulaciones, setEstadoPostulaciones] = useState({});
  const [modalRendimientoOpen, setModalRendimientoOpen] = useState(false);
  const [filtroNombreOferta, setFiltroNombreOferta] = useState("");
  const [filtroDescripcionOferta, setFiltroDescripcionOferta] = useState("");
  const [ofertasFiltradas, setOfertasFiltradas] = useState([]);
  const [filtroEstadoOferta, setFiltroEstadoOferta] = useState("");

  // Modal
  const [modalLicenciasACargo, setModalLicenciasACargo] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL;

  //trae los datos del manager
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error("No autenticado");
        const data = await res.json();

        setUser({
          id: data.id,
          nombre: data.nombre,
          apellido: data.apellido,
          username: data.username,
          correo: data.correo,
          roles: data.roles,
          empresaId: data.id_empresa,
          foto_url: data.foto_url
        });
      } catch (err) {
        console.error("Error al cargar usuario:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    cargarUsuario();
  }, []);

  useEffect(() => {
    if (!modalOfertasOpen) {
      setOfertasFiltradas(ofertasAsignadas);
      return;
    }
    setOfertasFiltradas(
      ofertasAsignadas.filter(oferta => {
        const estaCerrada = oferta.cerrada === true || oferta.is_active === false;
        const coincideEstado =
          filtroEstadoOferta === "" ||
          (filtroEstadoOferta === "abierta" && !estaCerrada) ||
          (filtroEstadoOferta === "cerrada" && estaCerrada);

        return (
          oferta.nombre.toLowerCase().includes(filtroNombreOferta.toLowerCase()) &&
          oferta.descripcion.toLowerCase().includes(filtroDescripcionOferta.toLowerCase()) &&
          coincideEstado
        );
      })
    );
  }, [ofertasAsignadas, filtroNombreOferta, filtroDescripcionOferta, filtroEstadoOferta, modalOfertasOpen]);

  const empresaId = user?.empresaId;
  const { estilos, loading: loadingEstilos } = useEmpresaEstilos(empresaId);

  const estilosSafe = {
    color_principal: estilos?.color_principal ?? "#2563eb",
    color_secundario: estilos?.color_secundario ?? "#f3f4f6",
    color_texto: estilos?.color_texto ?? "#000000",
    slogan: estilos?.slogan ?? "Bienvenido al panel de Reclutador",
    logo_url: estilos?.logo_url ?? null,
  };


  // Toast state
  const [toasts, setToasts] = useState([]);
  const toastIdRef = React.useRef(0);

  // Toast helpers
  const showToast = React.useCallback((message, type = "success", duration = 3500) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Toast component
  function Toast({ toasts, removeToast }) {
    return (
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`min-w-[260px] max-w-xs px-4 py-3 rounded shadow-lg text-white font-semibold flex items-center gap-2
                ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
              onClick={() => removeToast(toast.id)}
              role="alert"
            >
              {toast.type === "success" ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  const fetchOfertasAsignadas = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mis-ofertas-laborales-reclutador`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setOfertasAsignadas(data.ofertas);
        setEmpresa(data.empresa);
      } else {
        throw new Error(data.error || "Error al obtener ofertas asignadas");
      }
    } catch (err) {
      showToast(`${err.message}`, "error");
    }
  };

  const solicitarLicencia = async () => {
    // Validaciones
    if (!formLicencia.tipo || formLicencia.tipo.trim().length < 5) {
      showToast("El tipo de licencia debe tener al menos 5 caracteres.", "error");
      return;
    }
    if (!formLicencia.descripcion || formLicencia.descripcion.trim().length < 5) {
      showToast("La descripción debe tener al menos 5 caracteres.", "error");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/solicitud-licencia`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lic_type: formLicencia.tipo,
          description: formLicencia.descripcion,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Solicitud enviada correctamente.", "success");
        setFormLicencia({ tipo: "", descripcion: "" });
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (err) {
      showToast("Error al conectar con el servidor.", "error");
    }
  };


  const openModalOfertas = () => {
    setMensajeOfertas("");
    fetchOfertasAsignadas();
    setModalOfertasOpen(true);
  };


  //  abre modal y selecciona oferta
  const seleccionarLicencia = (id_licencia) => {
    console.log("ID recibido para subir certificado:", id_licencia);
    if (!id_licencia) {
      console.error("No se recibió un ID válido para la licencia.");
      return;
    }
    setLicenciaId(id_licencia);
  };

  // subir certificado
  const subirCertificado = async () => {
    if (!selectedFile) {
      showToast("Debes seleccionar un archivo PDF.", "error");
      return;
    }

    if (!licenciaId) {
      showToast("No se encontró la licencia a la cual subir el certificado.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    console.log("Subiendo certificado para la licencia ID:", licenciaId);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/subir-certificado/${licenciaId}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Certificado subido correctamente", "success");
        setModalLicenciasOpen(false);
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      showToast("Error al conectar con el servidor.", "error");
    }
  };

  // abrir modal de palabras claves
  const openEditarEtiquetas = (oferta) => {
    setSelectedOfertaId(oferta.id_oferta);
    setEtiquetasOferta(oferta.palabras_clave);
    setNuevasEtiquetas(oferta.palabras_clave);
    setMensajeEtiquetas("");
    setModalEditarEtiquetasOpen(true);
  };

  // guardar palabras claves nuevas
  const saveEtiquetas = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/definir_palabras_clave/${selectedOfertaId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ palabras_clave: nuevasEtiquetas }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showToast("Etiquetas actualizadas", "success");
        // refresca la lista de ofertas
        fetchOfertasAsignadas();
        setTimeout(() => setModalEditarEtiquetasOpen(false), 1000);
      } else {
        showToast(`${data.error}`, "error");
      }
    } catch {
      showToast("Error al conectar con el servidor", "error");
    }
  };

  const openVerPostulantes = async (id_oferta) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ver_candidatos/${id_oferta}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        setPostulantes(data);               // Se cargan todos los datos
        setPostulantesFiltrados(data);      // Se muestra en pantalla inicialmente
        setModalPostulantesOpen(true);      // Abre el modal
      } else {
        console.error("Error al obtener los postulantes");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  const toggleFiltros = () => {
    setMostrarFiltros(!mostrarFiltros);
  };

  const filtrarPostulantes = (nombre, email, is_apto, fecha_desde, fecha_hasta) => {
    const filtrados = postulantes.filter((p) => {
      return (
        (nombre === '' || p.nombre.toLowerCase().includes(nombre.toLowerCase())) &&
        (email === '' || p.email.toLowerCase().includes(email.toLowerCase())) &&
        (is_apto === '' || (is_apto === 'true' ? p.is_apto : !p.is_apto)) &&
        (fecha_desde === '' || new Date(p.fecha_postulacion) >= new Date(fecha_desde)) &&
        (fecha_hasta === '' || new Date(p.fecha_postulacion) <= new Date(fecha_hasta))
      );
    });
    setPostulantesFiltrados(filtrados);
  };

  // funcion para abir cv
  const openCv = (idCv) => {
    // Generar la URL completa sin el prefijo del router
    const url = `${import.meta.env.VITE_API_URL}/uploads/cvs/${idCv}`;
    window.open(url, "_blank");
  };

  const evaluarPostulacion = async (id_postulacion, nuevoEstado) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/evaluar-postulacion/${id_postulacion}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setEstadoPostulaciones((prev) => ({
          ...prev,
          [id_postulacion]: nuevoEstado,
        }));
      }
    } catch (err) {
    }
  };


  const handleImageUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/subir-image-reclutador`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        showToast("Imagen subida exitosamente", "success");
        setUser((prev) => ({ ...prev, fotoUrl: result.file_path }));
        setModalEditarPerfilOpen(false);
      } else {
        showToast("Error: " + (result.error || "desconocido"), "error");
      }
    } catch (err) {
      showToast("Error de conexión", "error");
    }
  };

  const handleProfileUpdate = async ({ nombre, apellido, username, email, password }) => {
    try {
      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al actualizar perfil");
      setUser(prev => ({ ...prev, username: result.username, correo: result.email }));
      setModalEditarPerfilOpen(false);
      showToast("Perfil actualizado correctamente.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const descargarReporteLicenciasAnalista = async (formato = "excel") => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reportes-licencias-analista?formato=${formato}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("No se pudo descargar el reporte");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = formato === "pdf" ? "reporte_licencias.pdf" : "reporte_licencias.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Reporte de licencias descargado correctamente.", "success");
    } catch (err) {
      showToast("Error al descargar el reporte de licencias", "error");
    }
  };

  const descargarReporteReclutamiento = async (formato) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reportes-reclutamiento-analista?formato=${formato}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Error al descargar el reporte");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `informe_reclutamiento.${formato === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("Reporte descargado correctamente.", "success");
    } catch (e) {
      showToast("No se pudo descargar el reporte.", "error");
    }
  };

  // Nueva función para descargar reporte solo de las ofertas filtradas
  const descargarReporteReclutamientoFiltrado = async (formato) => {
    try {
      const ids = ofertasFiltradas.map(o => o.id_oferta).join(",");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reportes-reclutamiento?formato=${formato}&ids=${ids}`,
        { method: "GET", credentials: "include" }
      );
      if (!res.ok) throw new Error("Error al descargar el reporte");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `informe_reclutamiento.${formato === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("Reporte descargado correctamente.", "success");
    } catch (e) {
      showToast("No se pudo descargar el reporte.", "error");
    }
  };

  const accionesPorSeccion = {
    ofertas: [
      {
        icon: Users,
        titulo: "Ver Listado de Ofertas Asignadas",
        descripcion: "Accede a tu listado de ofertas asignadas en el sistema",
        onClick: openModalOfertas,
      },
    ],
    licencias: [
      {
        icon: FilePlus,
        titulo: "Cargar Licencias",
        descripcion: "Carga una nueva licencia.",
        onClick: () => setModalLicenciaOpen(true),
      },
      {
        icon: FileSearchIcon,
        titulo: "Ver Mis Licencias",
        descripcion: "Accede al listado tus licencias.",
        onClick: () => setModalLicenciasOpen(true),
      },
      {
        icon: FileLock,
        titulo: "Gestionar Licencias",
        descripcion: "Accede a las licencias de los empleados y sus estados.",
        onClick: () => setModalLicenciasACargo(true),
      },
    ],
    metricas: [
      {
        icon: BarChart2,
        titulo: "Visualizar Indicadores de Desempeño y predicciones",
        descripcion: "Visualizá y administrá los empleados de tu empresa.",
        onClick: () => navigate("/reclutador/empleados-rendimiento"),
      },
      {
        icon: BarChart2,
        titulo: "Detección Temprana de Rotación y Riesgos Laborales",
        descripcion:
          "Identificá patrones que podrían anticipar despidos, renuncias o rotación de empleados.",
        onClick: () => navigate("/reclutador/empleados-riesgo"),
      },
    ],
  };
  
  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al cerrar sesión");
        navigate("/login");
      })
      .catch(err => console.error("Error al cerrar sesión:", err));
  };

  if (loadingUser) return <div className="p-10 text-center">Cargando usuario…</div>;
  if (!user) return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;

  return (
    <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe }}>
      <Toast toasts={toasts} removeToast={removeToast} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <PageLayout>
          <TopBar
            username={`${user.nombre} ${user.apellido}`}
            onLogout={handleLogout}
            style={{ backgroundColor: estilosSafe.color_principal }}
          />

          <div className="px-4 py-6">
            <div
              className="mx-auto w-fit text-sm font-medium px-4 py-2 rounded-full border shadow-sm"
              style={{
                backgroundColor: estilosSafe.color_secundario,
                borderColor: estilosSafe.color_principal,
                color: estilosSafe.color_texto,
              }}
            >
              {estilosSafe.slogan}
            </div>
          </div>

          <Acciones  acciones={accionesPorSeccion} estilos={estilosSafe}/>
        </PageLayout>

        {modalOfertasOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow space-y-4 text-black">
              <h2 className="text-xl font-semibold">Ofertas asignadas</h2>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Filtrar por nombre"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={filtroNombreOferta}
                  onChange={e => setFiltroNombreOferta(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Filtrar por descripción"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={filtroDescripcionOferta}
                  onChange={e => setFiltroDescripcionOferta(e.target.value)}
                />
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={filtroEstadoOferta}
                  onChange={e => setFiltroEstadoOferta(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="abierta">Abierta</option>
                  <option value="cerrada">Cerrada</option>
                </select>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => descargarReporteReclutamientoFiltrado("excel")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 transition font-semibold shadow"
                  title="Descargar reporte de reclutamiento en Excel"
                >
                  <Download className="w-5 h-5" />
                  Descargar Reporte Excel
                </button>
                <button
                  onClick={() => descargarReporteReclutamientoFiltrado("pdf")}
                  className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-900 transition font-semibold shadow"
                  title="Descargar reporte de reclutamiento en PDF"
                >
                  <Download className="w-5 h-5" />
                  Descargar Reporte PDF
                </button>
              </div>

              {ofertasFiltradas.length === 0 ? (
                <p>No hay ofertas asignadas.</p>
              ) : (
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {ofertasFiltradas.map((oferta) => {
                    // Determina el estado real de la oferta
                    const estaCerrada = oferta.cerrada === true || oferta.is_active === false;
                    return (
                      <li key={oferta.id_oferta} className="p-4 border rounded shadow bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{oferta.nombre}</h3>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-bold
            ${estaCerrada
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-green-100 text-green-700 border border-green-300"
                            }`}>
                            {estaCerrada ? "Cerrada" : "Abierta"}
                          </span>
                        </div>
                        <p className="text-sm">{oferta.descripcion}</p>
                        <p className="text-xs text-gray-600">
                          Publicación: {oferta.fecha_publicacion?.split("T")[0]} |
                          Cierre: {oferta.fecha_cierre?.split("T")[0]}
                        </p>
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() => openEditarEtiquetas(oferta)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded"
                          >
                            Editar etiquetas
                          </button>
                          <button
                            onClick={() => openVerPostulantes(oferta.id_oferta)}
                            className="px-3 py-1 bg-green-500 text-white rounded"
                          >
                            Ver postulantes
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="text-right pt-4">
                <button
                  onClick={() => setModalOfertasOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalLicenciaOpen && (
          <SolicitarLicenciaModal
            open={modalLicenciaOpen}
            onOpenChange={setModalLicenciaOpen}
          />
        )
        }

        {
          modalLicenciasOpen &&
          <LicenciasModal
            open={modalLicenciasOpen}
            onOpenChange={setModalLicenciasOpen}
            service={reclutadorService}
          />
        }

        {modalEditarEtiquetasOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
            onClick={() => {
              setModalEditarEtiquetasOpen(false);
              setMensajeEtiquetas("");
            }}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Título */}
              <h2 className="text-2xl font-semibold mb-4 text-center text-black">
                Editar Palabras Clave
              </h2>

              {/* palabras existentes */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-black">
                  Palabras clave ({nuevasEtiquetas.length}/3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {nuevasEtiquetas.length > 0 ? (
                    nuevasEtiquetas.map((tag, i) => (
                      <div
                        key={i}
                        className="flex items-center bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm"
                      >
                        {tag}
                        <button
                          className="ml-2 font-bold text-gray-500 hover:text-gray-800"
                          onClick={() =>
                            setNuevasEtiquetas(nuevasEtiquetas.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">(Sin etiquetas)</span>
                  )}
                </div>
              </div>

              {/* añadir etiqueta */}
              <div className="mb-4">
                {nuevasEtiquetas.length >  0 ? (
                  <>
                    <label className="block text-sm font-medium mb-1 text-black">
                      Añadir etiqueta
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Escribe y presiona Enter o pulsa Añadir"
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === ",") && e.currentTarget.value) {
                            e.preventDefault();
                            const val = e.currentTarget.value
                              .trim()
                              .replace(/,$/, "")
                              .toLowerCase();
                            if (val && !nuevasEtiquetas.includes(val)) {
                              setNuevasEtiquetas([...nuevasEtiquetas, val]);
                            }
                            e.currentTarget.value = "";
                          }
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded text-black"
                      />
                      <button
                        onClick={(e) => {
                          const inp = e.currentTarget.previousSibling;
                          const val = inp.value.trim().replace(/,$/, "").toLowerCase();
                          if (val && !nuevasEtiquetas.includes(val)) {
                            setNuevasEtiquetas([...nuevasEtiquetas, val]);
                          }
                          inp.value = "";
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Añadir
                      </button>
                    </div>
                  </>
                ) : null}
              </div>


              {mensajeEtiquetas && (
                <div
                  className={`mb-4 p-2 rounded text-center text-sm ${mensajeEtiquetas.startsWith("")
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-indigo-100 text-indigo-700"
                    }`}
                >
                  {mensajeEtiquetas}
                </div>
              )}

              {/* botones */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setModalEditarEtiquetasOpen(false);
                    setMensajeEtiquetas("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEtiquetas}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        <ModalPostulantes
          isOpen={modalPostulantesOpen}
          onClose={() => setModalPostulantesOpen(false)}
          setMostrarFiltros={setMostrarFiltros}
          filtros={filtros}
          setFiltros={setFiltros}
          toggleFiltros={toggleFiltros}
          mostrarFiltros={mostrarFiltros}
          filtrarPostulantes={filtrarPostulantes}
          postulantesFiltrados={postulantesFiltrados}
          estadoPostulaciones={estadoPostulaciones}
          evaluarPostulacion={evaluarPostulacion}
        />

        {modalRendimientoOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white p-6 rounded-2xl w-full sm:w-4/5 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-auto text-black">
              <EmpleadosRendimiento />
              <div className="mt-6 text-right">
                <button
                  onClick={() => setModalRendimientoOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        
          <LicenciasACargoModal
            open={modalLicenciasACargo}
            onOpenChange={setModalLicenciasACargo}
            service={reclutadorService}
            extraContent={
              <div className="mb-4 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => descargarReporteLicenciasAnalista("excel")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 transition font-semibold shadow"
                  title="Descargar reporte de licencias en Excel"
                >
                  <Download className="w-5 h-5" />
                  Descargar Licencias Excel
                </button>
                <button
                  onClick={() => descargarReporteLicenciasAnalista("pdf")}
                  className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-900 transition font-semibold shadow"
                  title="Descargar reporte de licencias en PDF"
                >
                  <Download className="w-5 h-5" />
                  Descargar Licencias PDF
                </button>
              </div>
            }
          />

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



      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}