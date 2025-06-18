import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart,
  BarChart2,
  Download,
  FileLock,
  FileSearchIcon,
  FileText,
  FileUp,
  PlusCircle,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GestionUsuarios from "../components/GestionUsuarios.jsx";
import { LicenciasACargoModal } from "../components/LicenciasACargoModal.jsx";
import ModalOferta from "../components/ModalOferta";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";
import PageLayout from "../components/PageLayout";
import RendimientoAnalistasTable from "../components/RendimientoAnalistasTable";
import { SolicitarLicenciaModal } from "../components/SolicitarLicenciaModal.jsx";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { managerService } from "../services/managerService.js";

import { Acciones } from "../components/Acciones.jsx";
import { LicenciasModal } from "../components/LicenciasModal.jsx";
import PeriodosEmpresaModal from "../components/PeriodosEmpresaModal";

import { ModalEncuesta } from "../components/ModalEncuesta";


// Toast system
function Toast({ toasts, removeToast }) {

    // 🔧 useEffect para eliminar solo los que tienen autoClose === true
  useEffect(() => {
    const timers = toasts
      .filter((t) => t.autoClose)
      .map((toast) =>
        setTimeout(() => removeToast(toast.id), 3000)
      );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

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
            role="alert"
            className={`relative min-w-[260px] max-w-xs px-4 py-3 rounded shadow-lg text-white font-semibold flex items-start gap-2 ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {/* Icono + mensaje */}
            <div className="flex items-start gap-2 pr-6">
              {toast.type === "success" ? (
                <svg
                  className="w-5 h-5 text-white mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-white mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="whitespace-pre-line">{toast.message}</span>
            </div>

            {/* Botón de cerrar */}
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-2 right-2 text-white hover:text-white text-lg font-bold"
              aria-label="Cerrar"
            >
              ✖
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function ManagerHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [modalOfertaOpen, setModalOfertaOpen] = useState(false);
  const [modalAnalistaOpen, setModalAnalistaOpen] = useState(false);
  const [modalVerOfertasOpen, setModalVerOfertasOpen] = useState(false);
  const [mensajeOferta, setMensajeOferta] = useState("");
  const [mensajeAnalista, setMensajeAnalista] = useState("");
  const [mensajeVerOfertas, setMensajeVerOferta] = useState("");
  const [mensajeAsignacion, setMensajeAsignacion] = useState("");
  const [formOferta, setFormOferta] = useState({});
  const [formAnalista, setFormAnalista] = useState({
    nombre: "",
    apellido: "",
    username: "",
    email: "",
  });
  const [ofertas, setOfertas] = useState([]);
  const [analistas, setAnalistas] = useState([]);
  const [selectedAnalistas, setSelectedAnalistas] = useState({});
  const [ofertasAsignadas, setOfertasAsignadas] = useState(new Set());
  const inputMetricasRef = useRef(null);
  const [modalEditarPerfilOpen, setModalEditarPerfilOpen] = useState(false);
  const [modalImageFile, setModalImageFile] = useState(null);
  const [modalGestionEquipo, setModalGestionEquipo] = useState(false);
  const navigate = useNavigate();
  const [modalSubirMetricas, setModalSubirMetricas] = useState(false);
  const [mensajeMetricas, setMensajeMetricas] = useState("");
  const [archivoMetricas, setArchivoMetricas] = useState(null);
  const [modalRendimientoAnalistas, setModalRendimientoAnalistas] =
    useState(false);
  const [modalSubirEmpleados, setModalSubirEmpleados] = useState(false);
  const [mensajeEmpleados, setMensajeEmpleados] = useState("");
  const [archivoEmpleados, setArchivoEmpleados] = useState(null);
  const inputEmpleadosRef = useRef();

  // Modal
  const [modalSolicitarLicencia, setModalSolicitarLicencia] = useState(false);
  const [modalLicenciasACargo, setModalLicenciasACargo] = useState(false);
  const [modalLicenciasOpen, setModalLicenciasOpen] = useState(false);
  const [modalPeriodosOpen, setModalPeriodosOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const [openDropdown, setOpenDropdown] = useState(false);

  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [ofertasFiltradas, setOfertasFiltradas] = useState([]);

  
  const [ofertasLibres, setOfertasLibres] = useState(new Set());
  
  const [modalEncuesta, setModalEncuesta] = useState(false);

  useEffect(() => {
    let filtradas = ofertas;
    if (filtroNombre)
      filtradas = filtradas.filter((o) =>
        o.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    if (filtroEstado)
      filtradas = filtradas.filter((o) =>
        filtroEstado === "abierta" ? o.is_active : !o.is_active
      );
    setOfertasFiltradas(filtradas);
  }, [ofertas, filtroNombre, filtroEstado]);

  //trae los datos del manager
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("No autenticado");
        const data = await res.json();
        // data ahora tiene { id, nombre, apellido, username, correo, roles, id_empresa }
        setUser({
          id: data.id,
          nombre: data.nombre,
          apellido: data.apellido,
          username: data.username,
          correo: data.correo,
          roles: data.roles,
          empresaId: data.id_empresa,
          foto_url: data.foto_url,
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
    const obtenerOfertasAsignadas = async () => {
      try {
        const response = await managerService.obtenerOfertasAsignadas();

        // ✅ Primero vemos qué llegó
        console.log("🧾 Datos crudos asignaciones:", response.data);

        // ✅ Solo asignadas
        const asignadas = new Set(
          response.data
            .filter((item) => item.estado === "asignada")
            .map((item) => Number(item.id_oferta))
        );

        setOfertasAsignadas(asignadas);

        // ✅ Mostramos qué quedó en el set
        console.log("🟩 OfertasAsignadas Set:", asignadas);
      } catch (error) {
        console.error("❌ Error al obtener ofertas asignadas:", error);
      }
    };

    if (modalVerOfertasOpen) {
      obtenerOfertasAsignadas();
    }
  }, [modalVerOfertasOpen]);



  useEffect(() => {
    const cargarOfertasLibres = async () => {
      try {
        const res = await fetch(`${API_URL}/ofertas-libres`, {
          credentials: "include",
        });
        const data = await res.json();

        // 🔁 Si data.libres es una lista de IDs (números o strings)
        const libresFiltradas = data.libres
          .map((id) => Number(id))
          .filter((id) => !ofertasAsignadas.has(id)); // ✅ excluí las que están asignadas

        setOfertasLibres(new Set(libresFiltradas));
        console.log("🟨 Ofertas libres (filtradas):", libresFiltradas);
      } catch (err) {
        console.error("Error cargando ofertas libres", err);
      }
    };

    if (modalVerOfertasOpen) {
      cargarOfertasLibres();
    }
  }, [modalVerOfertasOpen, ofertasAsignadas]); // ✅ importante: depende de ofertasAsignadas

  
  // Toast state
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Toast helpers
  const showToast = useCallback((message, type = "success", autoClose = true) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type, autoClose }]);

    if (autoClose) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    }
  }, []);
  
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const descargarReporteReclutamiento = async (formato = "excel") => {
    try {
      const ids = ofertasFiltradas.map((o) => o.id_oferta).join(",");
      console.log("Enviando IDs de ofertas filtradas:", ids); // 👈 Aquí ves los IDs que se envían
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/reportes-reclutamiento?formato=${formato}&ids=${ids}`,
        { method: "GET", credentials: "include" }
      );
      if (!res.ok) throw new Error("No se pudo descargar el reporte");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        formato === "pdf"
          ? "informe_reclutamiento.pdf"
          : "informe_reclutamiento.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Reporte descargado correctamente.", "success");
    } catch (err) {
      showToast("Error al descargar el reporte de reclutamiento", "error");
    }
  };

  const subirMetricasDesdeCSV = async () => {
    if (!archivoMetricas) {
      showToast("Selecciona un archivo CSV.", "error");
      return;
    }
    showToast("Subiendo archivo...", "success");
    const formData = new FormData();
    formData.append("file", archivoMetricas);

    try {
      const res = await fetch(`${API_URL}/api/subir-info-laboral-analistas`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Archivo subido correctamente.", "success");
      } else {
        showToast(data.error || "Error al subir el archivo.", "error");
      }
    } catch (err) {
      showToast("Error de conexión.", "error");
    }
  };

  const empresaId = user?.empresaId;
  const preferencias = useEmpresaEstilos(empresaId);

  console.log({ preferencias });

  const estilos = {
    color_principal: preferencias.estilos?.color_principal ?? "#2563eb",
    color_secundario: preferencias.estilos?.color_secundario ?? "#f3f4f6",
    color_texto: preferencias.estilos?.color_texto ?? "#000000",
    slogan: preferencias.estilos?.slogan ?? "Bienvenido al panel de Manager",
    logo_url: preferencias.estilos?.logo_url ?? null,
  };

  const subirEmpleadosDesdeCSV = async () => {
    if (!archivoEmpleados) {
      showToast("Selecciona un archivo CSV.", "error");
      return;
    }
    showToast("Subiendo archivo...", "success");
    const formData = new FormData();
    formData.append("file", archivoEmpleados);

    try {
      const res = await fetch(`${API_URL}/api/registrar-empleados-manager`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Archivo subido correctamente.", "success");
      } else {
        showToast(data.error || "Error al subir el archivo.", "error");
      }
    } catch (err) {
      showToast("Error de conexión.", "error");
    }
  };

  //funcion para crear una oferta laboral
  const crearOfertaLaboral = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/crear_oferta_laboral`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formOferta),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showToast(
          `Oferta creada: ${data.nombre} (ID: ${data.id_oferta})`,
          "success"
        );
        setFormOferta({});
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (err) {
      showToast("Error al conectar con el servidor", "error");
    }
  };

  const crearAnalista = async () => {
    if (formAnalista.username.trim().length < 4) {
      showToast(
        "El nombre de usuario debe tener al menos 4 caracteres.",
        "error"
      );
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/registrar-reclutador`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formAnalista.nombre,
            lastname: formAnalista.apellido,
            username: formAnalista.username,
            email: formAnalista.email,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        showToast(
          `Analista creado: ${data.credentials.username}\nContraseña temporal: ${data.credentials.password}`,
          "success",
          false // 🔧 Esto evita que se borre solo
        );
        setFormAnalista({ nombre: "", apellido: "", username: "", email: "" });
      } else {
        showToast(`Error: ${data.error}`, "error"); // 🔧 Se borra solo por defecto
      }
    } catch (err) {
      showToast("Error al conectar con el servidor", "error");
    }
  };

  //funcion para traer las ofertas que creo el manager
  const fetchMisOfertas = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/mis-ofertas-laborales`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) setOfertas(data.ofertas);
      else throw new Error(data.error || "Error al obtener ofertas");
    } catch (err) {
      setMensajeVerOferta(err.message);
    }
  };

  const fetchAnalistas = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/empleados-manager`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok)
        setAnalistas(data.filter((e) => e.roles.includes("reclutador")));
      else throw new Error("Error al obtener analistas");
    } catch (err) {
      setMensaje(err.message);
    }
  };

  const openModalVerOfertas = async () => {
    await fetchMisOfertas();
    await fetchAnalistas();

    try {
      const asignaciones = await managerService.obtenerAnalistasAsignados();
      setSelectedAnalistas(asignaciones);
    } catch (error) {
      console.error("Error al obtener analistas asignados:", error);
    }

    setModalVerOfertasOpen(true);
  };

  const descargarReporteEficaciaReclutadores = async (formato = "pdf") => {
    try {
      const ids = ofertasFiltradas.map((o) => o.id_oferta).join(",");
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/reporte-eficacia-reclutadores?formato=${formato}&ids=${ids}`,
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
      a.download =
        formato === "pdf"
          ? "eficacia_reclutadores.pdf"
          : "eficacia_reclutadores.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Reporte descargado correctamente.", "success");
    } catch (err) {
      showToast(
        "Error al descargar el reporte de eficacia de reclutadores",
        "error"
      );
    }
  };

  const descargarReporteLicencias = async (formato = "excel") => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/reportes-licencias-manager?formato=${formato}`,
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
      a.download =
        formato === "pdf" ? "reporte_licencias.pdf" : "reporte_licencias.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Reporte de licencias descargado correctamente.", "success");
    } catch (err) {
      showToast("Error al descargar el reporte de licencias", "error");
    }
  };

  const handleSelectAnalista = (ofertaId, analistaId) => {
    setSelectedAnalistas((prev) => {
      const actualizado = { ...prev };
      if (analistaId === "") {
        delete actualizado[ofertaId]; //  Elimina el campo si está vacío
      } else {
        actualizado[ofertaId] = analistaId;
      }
      return actualizado;
    });
  };

  const asignarAnalista = async (ofertaId) => {
    const analistaId = selectedAnalistas[ofertaId];
    if (!analistaId) {
      showToast("Seleccione un analista antes de asignar.", "error");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/asignar-analista-oferta`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_oferta: ofertaId,
            id_analista: analistaId,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast(data.message, "success");

        // ✅ Marcar como asignada
        setOfertasAsignadas((prev) => new Set(prev).add(ofertaId));

        // ✅ Eliminar de la lista de "libres"
        setOfertasLibres((prev) => {
          const nuevo = new Set(prev);
          nuevo.delete(ofertaId);
          return nuevo;
        });


        //  marcar como asignada
        setOfertasAsignadas((prev) => new Set(prev).add(ofertaId));
      } else {
        throw new Error(data.error || data.message);
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const cerrarOferta = async (id_oferta) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cerrar_oferta/${id_oferta}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Oferta cerrada exitosamente.", "success");
        // Refresca las ofertas para actualizar el estado
        fetchMisOfertas();
      } else {
        showToast(data.error || "Error al cerrar la oferta.", "error");
      }
    } catch (err) {
      showToast("Error al conectar con el servidor.", "error");
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/subir-image-manager`, {
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
      showToast("Perfil actualizado correctamente.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const accionesPorSeccion = {
    licencias: [
      {
        icon: FileUp,
        titulo: "Solicitar Licencia",
        descripcion: "Solicituar una nueva licencia.",
        onClick: () => setModalSolicitarLicencia(true),
      },
      {
        icon: FileSearchIcon,
        titulo: "Ver Mis Licencias",
        descripcion: "Accede al listado tus licencias.",
        onClick: () => setModalLicenciasOpen(true),
      },
      {
        icon: FileLock,
        titulo: "Consultar Licencias",
        descripcion: "Accede a las licencias del personal y sus estados.",
        onClick: () => setModalLicenciasACargo(true),
      },
    ],
    ofertas: [
      {
        icon: Users,
        titulo: "Ver Listado de Ofertas",
        descripcion: "Accede al listado de ofertas disponibles en el sistema.",
        onClick: openModalVerOfertas,
      },
      {
        icon: PlusCircle,
        titulo: "Publicar una Nueva Oferta",
        descripcion: "Crea y publica nuevas ofertas en el sistema.",
        onClick: () => setModalOfertaOpen(true),
      },
    ],
    empleados: [
      {
        icon: FileText,
        titulo: "Subir Empleados por CSV",
        descripcion: "Carga empleados en lote desde un archivo CSV.",
        onClick: () => setModalSubirEmpleados(true),
      },
      {
        icon: Users,
        titulo: "Gestionar equipo",
        descripcion: "Visualizá y administrá los analistas a tu cargo",
        onClick: () => setModalGestionEquipo(true),
      },
    ],
    metricas: [
      {
        icon: BarChart,
        titulo: "Crear Analista",
        descripcion: "Registrá nuevos analistas para tu empresa.",
        onClick: () => setModalAnalistaOpen(true),
      },
      {
        icon: FileText,
        titulo: "Gestionar Periodos",
        descripcion: "Ver, cerrar o crear periodos de desempeño.",
        onClick: () => setModalPeriodosOpen(true),
      },
      {
        icon: BarChart2,
        titulo: "Subir Métricas de Analistas y Empleados",
        descripcion:
          "Carga un archivo CSV con métricas de desempeño y rotación de analistas.",
        onClick: () => setModalSubirMetricas(true),
      },
      {
        icon: BarChart2,
        titulo: "Editar Métricas de Analistas y Empleados",
        descripcion:
          "Visualizá y editá las métricas de tus analistas y empleados en una tabla interactiva.",
        onClick: () => setModalRendimientoAnalistas(true),
      },
      {
        icon: BarChart2,
        titulo: "Visualizar Indicadores de Desempeño y predicciones",
        descripcion: "Visualizá y administrá los empleados de tu empresa.",
        onClick: () => navigate("/manager/empleados-rendimiento-analistas"),
      },
      {
        icon: BarChart2,
        titulo: "Detección Temprana de Rotación y Riesgos Laborales",
        descripcion:
          "Identificá patrones que podrían anticipar despidos, renuncias o rotación de empleados.",
        onClick: () => navigate("/manager/analistas-riesgo"),
      },
    ],
    encuestas: [
      {
        icon: FileLock,
        titulo: "Crear Encuesta",
        descripcion: "Diseñá encuestas para obtener feedback del personal.",
        onClick: () => setModalEncuesta(true),
      },
      {
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
    ],
  };

  if (loadingUser)
    return <div className="p-10 text-center">Cargando usuario…</div>;
  if (!user)
    return (
      <div className="p-10 text-center text-red-600">
        No se pudo cargar el usuario.
      </div>
    );

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
            username={`${user.nombre} ${user.apellido}`}
            user={{
              nombre: user.nombre,
              apellido: user.apellido,
              correo: user.correo,
              fotoUrl: user.foto_url,
              cvUrl: user.cvUrl, // quita si no existe
            }}
            onEditPerfil={() => setModalEditarPerfilOpen(true)}
            onPostulacion={() => navigate("/manager/postulaciones")}
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

          <Acciones acciones={accionesPorSeccion} estilos={estilos} />

          <PeriodosEmpresaModal
            open={modalPeriodosOpen}
            onClose={() => setModalPeriodosOpen(false)}
            apiUrl={import.meta.env.VITE_API_URL}
            showToast={showToast}
          />
          
          <ModalOferta
            modalOfertaOpen={modalOfertaOpen}
            setModalOfertaOpen={setModalOfertaOpen}
            crearOfertaLaboral={crearOfertaLaboral}
            formOferta={formOferta}
            setFormOferta={setFormOferta}
          />

          {modalAnalistaOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4">
                {/* Elimina cualquier mensaje dentro de la modal */}
                <h2 className="text-lg font-semibold text-black">
                  Nuevo Analista
                </h2>
                <div className="space-y-2">
                  {Object.entries({
                    nombre: "Nombre",
                    apellido: "Apellido",
                    username: "Nombre de usuario",
                    email: "Correo electrónico",
                  }).map(([campo, etiqueta]) => (
                    <div key={campo}>
                      <label className="text-sm font-medium text-black">
                        {etiqueta}
                      </label>
                      <input
                        type={campo === "email" ? "email" : "text"}
                        placeholder={etiqueta}
                        value={formAnalista[campo]}
                        onChange={(e) =>
                          setFormAnalista({
                            ...formAnalista,
                            [campo]: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded text-black"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setModalAnalistaOpen(false);
                      setMensajeAnalista("");
                    }}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={crearAnalista}
                    className="px-4 py-2 text-white rounded bg-indigo-600"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalRendimientoAnalistas && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-2xl w-full sm:w-11/12 md:w-5/6 lg:w-3/4 max-h-[80vh] overflow-auto text-black">
                <RendimientoAnalistasTable
                  onSuccess={() => setModalRendimientoAnalistas(false)}
                />
                <div className="mt-6 text-right">
                  <button
                    onClick={() => setModalRendimientoAnalistas(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalVerOfertasOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
              <div className="bg-white/90 backdrop-blur-lg p-6 rounded-2xl w-3/4 max-h-[89.9vh] text-black shadow-xl flex flex-col">
                {/* Elimina cualquier mensaje dentro de la modal */}
                <h2 className="text-2xl font-semibold mb-4">Mis Ofertas</h2>
                <div className="mb-4 flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-xs text-gray-600">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={filtroNombre}
                      onChange={(e) => setFiltroNombre(e.target.value)}
                      className="border px-2 py-1 rounded text-black"
                      placeholder="Buscar por nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">
                      Estado
                    </label>
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="border px-2 py-1 rounded text-black"
                    >
                      <option value="">Todos</option>
                      <option value="abierta">Abierta</option>
                      <option value="cerrada">Cerrada</option>
                    </select>
                  </div>
                </div>
                {/* BOTONES PARA RECLUTAMIENTO Y EFICACIA EN UN DESPLEGABLE */}
                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-900 transition font-semibold shadow"
                      title="Descargar reportes"
                      type="button"
                      onClick={() => setOpenDropdown((open) => !open)}
                    >
                      <Download className="w-5 h-5" />
                      Descargar reportes
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {openDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50">
                        <div className="py-2">
                          <div className="px-4 py-1 text-xs text-gray-500 font-semibold">
                            Informe Reclutamiento
                          </div>
                          <button
                            onClick={() => {
                              setOpenDropdown(false);
                              descargarReporteReclutamiento("excel");
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 text-blue-700"
                          >
                            <Download className="w-4 h-4" />
                            Descargar en Excel
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(false);
                              descargarReporteReclutamiento("pdf");
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 text-red-700"
                          >
                            <Download className="w-4 h-4" />
                            Descargar en PDF
                          </button>
                          <div className="px-4 py-1 mt-2 text-xs text-gray-500 font-semibold border-t">
                            Eficacia Reclutadores
                          </div>
                          <button
                            onClick={() => {
                              setOpenDropdown(false);
                              descargarReporteEficaciaReclutadores("excel");
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 text-blue-700"
                          >
                            <Download className="w-4 h-4" />
                            Descargar en Excel
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(false);
                              descargarReporteEficaciaReclutadores("pdf");
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 text-red-700"
                          >
                            <Download className="w-4 h-4" />
                            Descargar en PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {ofertasFiltradas.length === 0 ? (
                  <p>No hay ofertas disponibles.</p>
                ) : (
                  <div className="flex-1 overflow-auto">
                    <table className="min-w-full table-auto border-collapse text-black">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 text-left">Nombre</th>
                          <th className="px-4 py-2 text-left">Descripción</th>
                          <th className="px-4 py-2 text-left">
                            Asignar Analista
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ofertasFiltradas.map((o) => {
                          const id = Number(o.id_oferta);
                          const estaAsignada = ofertasAsignadas.has(id);
                          const estaLibre = ofertasLibres.has(id); // sigue existiendo pero se chequea después
                          const analistaSeleccionado = selectedAnalistas[o.id_oferta];

                          let claseColor = "";
                          let icono = "";
                          let tooltip = "";

                          if (!o.is_active) {
                            claseColor = "bg-red-100 text-red-800";
                            icono = "🛑";
                            tooltip = "Oferta cerrada";
                          } else if (estaAsignada) {
                            // 🟩 Prioridad: si está asignada, se pinta de verde SIEMPRE
                            claseColor = "bg-green-100 text-green-800";
                            icono = "✅";
                            tooltip = "Analista asignado";
                          } else if (estaLibre) {
                            // 🟨 Solo si no está asignada
                            claseColor = "bg-yellow-100 text-yellow-800";
                            icono = "⚠️";
                            tooltip = "Oferta libre (sin analista)";
                          } else if (analistaSeleccionado) {
                            claseColor = "bg-orange-200 text-orange-800";
                            icono = "⏳";
                            tooltip = "Analista seleccionado pero no asignado";
                          } else {
                            claseColor = "bg-yellow-100 text-yellow-800";
                            icono = "⚠️";
                            tooltip = "Sin analista asignado";
                          }

                          console.log(
                            `Oferta ${o.id_oferta}: asignada=${estaAsignada}, libre=${estaLibre}, seleccion=${analistaSeleccionado}`
                          );

                          return (
                            <tr key={o.id_oferta} className={`border-t ${claseColor}`}>
                              <td className="px-4 py-2 flex items-center gap-2">
                                <span title={tooltip}>{icono}</span> {o.nombre}
                              </td>
                              <td className="px-4 py-2">{o.descripcion}</td>
                              <td className="px-4 py-2 flex items-center gap-2">
                                <select
                                  value={selectedAnalistas[o.id_oferta] || ""}
                                  onChange={(e) =>
                                    handleSelectAnalista(o.id_oferta, e.target.value)
                                  }
                                  className="border px-2 py-1 rounded mr-2 text-black"
                                  disabled={!o.is_active || estaAsignada}
                                >
                                  <option value="">Seleccione analista</option>
                                  {analistas.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.username}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => asignarAnalista(o.id_oferta)}
                                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                  disabled={!o.is_active || estaAsignada}
                                >
                                  Asignar
                                </button>
                                {o.is_active && (
                                  <button
                                    onClick={() => cerrarOferta(o.id_oferta)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                                  >
                                    Cerrar
                                  </button>
                                )}
                                {!o.is_active && (
                                  <span className="ml-2 text-xs text-red-600 font-semibold">
                                    Oferta cerrada
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 text-right">
                  <button
                    onClick={() => {
                      setModalVerOfertasOpen(false);
                      setMensajeAsignacion("");
                      setSelectedAnalistas((prev) => {
                        const nuevo = { ...prev };
                        for (const ofertaId in nuevo) {
                          if (!ofertasAsignadas.has(Number(ofertaId))) {
                            delete nuevo[ofertaId]; // ✅ solo si estaba en naranja
                          }
                        }
                        return nuevo;
                      });
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          <LicenciasModal
            onOpenChange={setModalLicenciasOpen}
            open={modalLicenciasOpen}
            service={managerService}
          />

          <LicenciasACargoModal
            onOpenChange={setModalLicenciasACargo}
            open={modalLicenciasACargo}
            service={managerService}
            extraContent={
              <div className="mb-4 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => descargarReporteLicencias("excel")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 transition font-semibold shadow"
                  title="Descargar reporte de licencias en Excel"
                >
                  <Download className="w-5 h-5" />
                  Descargar Licencias Excel
                </button>
                <button
                  onClick={() => descargarReporteLicencias("pdf")}
                  className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-900 transition font-semibold shadow"
                  title="Descargar reporte de licencias en PDF"
                >
                  <Download className="w-5 h-5" />
                  Descargar Licencias PDF
                </button>
              </div>
            }
          />

          <SolicitarLicenciaModal
            onOpenChange={setModalSolicitarLicencia}
            open={modalSolicitarLicencia}
          />

          {modalSubirEmpleados && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-2xl w-full sm:w-4/5 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-auto text-black">
                <h2 className="text-lg font-semibold mb-4">
                  Subir Empleados por CSV
                </h2>

                {/* Botón "Seleccionar archivo" estilizado */}
                <div className="mb-4">
                  <input
                    type="file"
                    accept=".csv"
                    ref={inputEmpleadosRef}
                    onChange={(e) => setArchivoEmpleados(e.target.files[0])}
                    className="hidden"
                    id="input-empleados"
                  />
                  <label
                    htmlFor="input-empleados"
                    className="cursor-pointer inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Seleccionar archivo
                  </label>

                  {/* Nombre del archivo cargado */}
                  {archivoEmpleados && (
                    <div className="mt-2 text-sm text-gray-700">
                      Archivo seleccionado: <b>{archivoEmpleados.name}</b>
                    </div>
                  )}
                </div>

                {/* Mensaje de alerta */}
                {/* {mensajeEmpleados && <MensajeAlerta texto={mensajeEmpleados} />} */}

                {/* Botones de acción */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setModalSubirEmpleados(false);
                      setMensajeEmpleados("");
                      setArchivoEmpleados(null);
                      if (inputEmpleadosRef.current)
                        inputEmpleadosRef.current.value = "";
                    }}
                    className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={subirEmpleadosDesdeCSV}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Subir
                  </button>
                </div>

                {/* Instrucción sobre columnas */}
                <div className="mt-4 text-xs text-gray-500">
                  El archivo debe tener las columnas: <br />
                  <b>nombre, apellido, email, username, contrasena, puesto</b>
                </div>
              </div>
            </div>
          )}

          {modalSubirMetricas && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-2xl w-full sm:w-4/5 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-auto text-black">
                <h2 className="text-lg font-semibold mb-4">
                  Subir Métricas de Analistas
                </h2>

                {/* Botón personalizado para seleccionar archivo */}
                <div className="mb-4">
                  <input
                    type="file"
                    accept=".csv"
                    ref={inputMetricasRef}
                    onChange={(e) => setArchivoMetricas(e.target.files[0])}
                    className="hidden"
                    id="input-metricas"
                  />
                  <label
                    htmlFor="input-metricas"
                    className="cursor-pointer inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Seleccionar archivo
                  </label>

                  {/* Mostrar nombre del archivo */}
                  {archivoMetricas && (
                    <div className="mt-2 text-sm text-gray-700">
                      Archivo seleccionado: <b>{archivoMetricas.name}</b>
                    </div>
                  )}
                </div>

                {/* Mensaje de alerta si hay */}
                {/* {mensajeMetricas && <MensajeAlerta texto={mensajeMetricas} />} */}

                {/* Botones de acción */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setModalSubirMetricas(false);
                      setMensajeMetricas("");
                      setArchivoMetricas(null);
                      if (inputMetricasRef.current)
                        inputMetricasRef.current.value = "";
                    }}
                    className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={subirMetricasDesdeCSV}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Subir
                  </button>
                </div>

                {/* Instrucciones de columnas */}
                <div className="mt-4 text-xs text-gray-500">
                  El archivo debe tener las columnas: <br />
                  <b>
                    id_empleado, desempeno_previo, cantidad_proyectos,
                    tamano_equipo, horas_extras, antiguedad, horas_capacitacion,
                    ausencias_injustificadas, llegadas_tarde, salidas_tempranas
                  </b>
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

          {modalGestionEquipo && (
            <GestionUsuarios
              service={managerService}
              onClose={() => setModalGestionEquipo(false)}
              textColor={estilos.color_texto}
            />
          )}
          {modalEncuesta && (
            <ModalEncuesta
              open={modalEncuesta}
              onOpenChange={setModalEncuesta}
            />
          )}
        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}
