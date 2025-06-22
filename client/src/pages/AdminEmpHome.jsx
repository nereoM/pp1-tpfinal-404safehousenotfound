import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  FileCheck,
  FileLock,
  Settings,
  Upload,
  UploadCloud,
  UserPlus,
  Users,
  XCircle
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Acciones } from "../components/Acciones.jsx";
import GestionUsuarios from "../components/GestionUsuarios";
import { LicenciasACargoModal } from "../components/LicenciasACargoModal.jsx";
import MensajeAlerta from "../components/MensajeAlerta";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";

import { GestionarEncuestasModal } from "../components/EncuestaModal/GestionarEncuesta/GestionarEncuestasModal.jsx";
import { ModalEncuesta } from "../components/ModalEncuesta";

import { EncuestasPendientesModal } from "../components/EncuestaModal/EncuestasPendientes/EncuestasPendientesModal";

import { EncuestasRespondidasModal } from "../components/EncuestaModal/EncuestasRespondidas/EncuestasRespondidasModal";

import { FileSearchIcon, FileText } from "lucide-react";
import { ExpiredSession } from "../components/ExpiredSession.jsx";
import PageLayout from "../components/PageLayout";
import PreferenciasEmpresa from "../components/PreferenciasEmpresa";
import SubirEmpleados from "../components/RegistrarEmpleados";
import { SearchModal } from "../components/SearchModal.jsx";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { adminEmpService } from "../services/adminEmpService";
const API_URL = import.meta.env.VITE_API_URL;

export default function AdminEmpHome() {
  // --- TODOS LOS HOOKS AL PRINCIPIO ---
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [modalPreferencias, setModalPreferencias] = useState(false);
  const [modalEncuesta, setModalEncuesta] = useState(false);
  const [modalGestionEncuestas, setModalGestionEncuestas] = useState(false);

  const [modalVerEncuesta, setModalVerEncuesta] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);

  const [modalEncuestasPendientes, setModalEncuestasPendientes] =
    useState(false);

  const [modalEncuestasRespondidas, setModalEncuestasRespondidas] =
    useState(false);

  const [encuestasRespondidas, setEncuestasRespondidas] = useState([
    {
      id: 1,
      titulo: "Encuesta de Clima Laboral",
      descripcion: "Queremos conocer cómo te sentís en tu lugar de trabajo.",
      respuestas: [
        {
          pregunta: "¿Cómo evaluás el ambiente laboral?",
          respuesta: "Bueno",
          comentario: "A veces hay tensión en el equipo.",
        },
        {
          pregunta: "¿Qué mejorarías?",
          respuesta: "La comunicación entre áreas.",
        },
        {
          pregunta: "¿Qué áreas te gustaría fortalecer?",
          respuesta: ["Trabajo en equipo", "Motivación"],
        },
      ],
    },
    {
      id: 2,
      titulo: "Satisfacción con Capacitación",
      descripcion: "Tu opinión sobre las oportunidades de aprendizaje.",
      respuestas: [
        {
          pregunta: "¿Cómo fue la última capacitación?",
          respuesta: "Muy buena",
          comentario: "Me gustó que fue interactiva.",
        },
      ],
    },
    {
      id: 3,
      titulo: "Evaluación de Herramientas de Trabajo",
      descripcion:
        "Queremos conocer tu experiencia con las herramientas digitales.",
      respuestas: [
        {
          pregunta: "¿Las herramientas son suficientes?",
          respuesta: "Sí",
        },
      ],
    },
  ]);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    username: "",
    email: "",
  });
  const [modalLicenciasOpen, setModalLicenciasOpen] = useState(false);
  const [licencias, setLicencias] = useState([]);
  const [mensajeLicencias, setMensajeLicencias] = useState("");
  const [mensajeEvaluacion, setMensajeEvaluacion] = useState("");
  const [modalSubirEmpleados, setModalSubirEmpleados] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [modalRechazoOpen, setModalRechazoOpen] = useState(false);
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);
  const [modalEditarPerfilOpen, setModalEditarPerfilOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [username, setUsername] = useState("");
  const [modalImageFile, setModalImageFile] = useState(null);
  const [mensajeError, setMensajeError] = useState("");
  const [modalSubirMetricas, setModalSubirMetricas] = useState(false);
  const [mensajeMetricas, setMensajeMetricas] = useState("");
  const [archivoMetricas, setArchivoMetricas] = useState(null);
  const [toasts, setToasts] = useState([]);

  const inputMetricasRef = React.useRef(null);
  const toastIdRef = React.useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    adminEmpService
      .obtenerInfoAdminEmpresa()
      .then(setUser)
      .catch((err) => console.error("❌ Error al obtener usuario:", err))
      .finally(() => setLoadingUser(false));
  }, []);
  const empresaId = user?.empresa_id;
  const { estilos, loading: loadingEstilos } = useEmpresaEstilos(empresaId);
  const showToast = React.useCallback(
    (message, type = "success", duration = 3500) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));
  // --- FIN HOOKS ---

  // --- IFs DE CARGA ---
  if (loadingUser)
    return <div className="p-10 text-center">Cargando usuario…</div>;
  if (!user) return <ExpiredSession />;
  if (loadingEstilos)
    return (
      <div className="p-10 text-center">Cargando preferencias de empresa…</div>
    );
  // --- FIN IFs DE CARGA ---

  // --- RESTO DE LA LÓGICA Y RETURN ---
  const estilosSafe = {
    color_principal: estilos?.color_principal ?? "#2563eb",
    color_secundario: estilos?.color_secundario ?? "#f3f4f6",
    color_texto: estilos?.color_texto ?? "#000000",
    slogan:
      estilos?.slogan ?? "Bienvenido al panel de Administración de Empresa",
    logo_url: estilos?.logo_url ?? null,
  };

  const handleActualizarEstilos = () => {
    setModalPreferencias(false);
    setTimeout(() => window.location.reload(), 300);
  };

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
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  const obtenerLicencias = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/licencias-mis-managers`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      setLicencias(json.licencias);
    } catch (error) {
      showToast("Error al cargar las licencias.", "error");
    }
  };

  const evaluarLicencia = async (id_licencia, nuevoEstado) => {
    try {
      const payload = { estado: nuevoEstado };
      if (nuevoEstado === "rechazada") {
        payload.motivo = motivoRechazo;
      }
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/licencia-${id_licencia}-empleado/evaluacion`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showToast(
          data.message || "Estado actualizado correctamente.",
          "success"
        );
        setMotivoRechazo("");
        obtenerLicencias();
      } else {
        showToast(data.error || "Error al procesar la solicitud.", "error");
      }
    } catch (error) {
      showToast("Error al procesar la solicitud.", "error");
    }
  };

  const abrirModalRechazo = (licencia) => {
    setLicenciaSeleccionada(licencia);
    setModalRechazoOpen(true);
  };

  const subirEmpleadosDesdeCSV = async (file) => {
    try {
      const data = await adminEmpService.registrarEmpleadosDesdeCSV(file);
      showToast(
        data.message || "Empleados registrados correctamente.",
        "success"
      );
    } catch (error) {
      showToast("Error al registrar empleados.", "error");
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
      const res = await fetch(`${API_URL}/api/subir-info-laboral-empleados`, {
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

  const crearManager = async () => {
    if (!formData.nombre.trim() || formData.nombre.trim().length < 2) {
      showToast("El nombre debe tener al menos 2 caracteres.", "error");
      return;
    }
    if (!formData.apellido.trim() || formData.apellido.trim().length < 2) {
      showToast("El apellido debe tener al menos 2 caracteres.", "error");
      return;
    }
    if (!formData.username.trim() || formData.username.trim().length < 4) {
      showToast(
        "El nombre de usuario debe tener al menos 4 caracteres.",
        "error"
      );
      return;
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      showToast("El correo electrónico no es válido.", "error");
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/registrar-manager`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.nombre,
            lastname: formData.apellido,
            username: formData.username,
            email: formData.email,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrar el manager.");
      }
      const data = await response.json();
      showToast(
        `Usuario creado correctamente.\nUsername: ${data.credentials.username}\nContraseña temporal: ${data.credentials.password}`,
        "success"
      );
      setFormData({ nombre: "", apellido: "", username: "", email: "" });
    } catch (error) {
      showToast(error.message || "Error al conectar con el servidor.", "error");
    }
  };

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cerrar sesión");
        navigate("/login");
      })
      .catch((err) => console.error("Error al cerrar sesión:", err));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/subir-image-admin`, {
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
    usuarios: [
      {
        icon: UserPlus,
        titulo: "Crear Managers",
        descripcion: "Designá managers para gestionar ofertas y equipos.",
        onClick: () => setModalOpen(true),
      },
      {
        icon: Users,
        titulo: "Gestionar Usuarios",
        descripcion: "Visualizá y administrá los usuarios de tu empresa.",
        onClick: () => setModalUsuarios(true),
      },
    ],
    empresa: [
      {
        icon: Settings,
        titulo: "Configurar Empresa",
        descripcion: "Ajustes de estilo y datos empresariales.",
        onClick: () => setModalPreferencias(true),
      },
    ],
    licencias: [
      {
        icon: FileLock,
        titulo: "Consultar Licencias",
        descripcion: "Accede a las licencias del personal y sus estados.",
        onClick: () => setModalLicenciasOpen(true),
      },
    ],
    metricas: [
      {
        icon: Upload,
        titulo: "Subir Empleados",
        descripcion: "Carga un archivo CSV para registrar empleados.",
        onClick: () => setModalSubirEmpleados(true),
      },
      {
        icon: Upload,
        titulo: "Subir Métricas de Desempeño",
        descripcion:
          "Carga un archivo CSV con métricas de desempeño y rotación.",
        onClick: () => setModalSubirMetricas(true),
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

  return (
    <EstiloEmpresaContext.Provider
      value={{ estilos: estilosSafe, loading: loadingEstilos }}
    >
      <SearchModal actions={accionesPorSeccion}/>
      <Toast toasts={toasts} removeToast={removeToast} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <PageLayout textColor={estilosSafe.color_texto}>
          <TopBar
            username={`${user.nombre} ${user.apellido}`}
            onLogout={handleLogout}
            textColor={estilosSafe.color_texto}
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

          <Acciones acciones={accionesPorSeccion} estilos={estilosSafe} />

          {modalUsuarios && (
            <GestionUsuarios
              service={adminEmpService}
              onClose={() => setModalUsuarios(false)}
              textColor={estilosSafe.color_texto}
            />
          )}

          {modalPreferencias && (
            <PreferenciasEmpresa
              idEmpresa={empresaId}
              onClose={() => setModalPreferencias(false)}
              estilosEmpresa={estilosSafe}
              onActualizar={handleActualizarEstilos}
            />
          )}

          {modalEncuesta && (
            <ModalEncuesta
              open={modalEncuesta}
              onOpenChange={setModalEncuesta}
            />
          )}

          <GestionarEncuestasModal
            open={modalGestionEncuestas}
            onOpenChange={setModalGestionEncuestas}
          />

          <EncuestasPendientesModal
            open={modalEncuestasPendientes}
            onOpenChange={setModalEncuestasPendientes}
          />

          <EncuestasRespondidasModal
            open={modalEncuestasRespondidas}
            onOpenChange={setModalEncuestasRespondidas}
            encuestas={encuestasRespondidas}
          />

          {modalOpen && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setModalOpen(false)}
            >
              <div
                className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold" style={{ color: "#000" }}>
                  Nuevo Manager
                </h2>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#000" }}
                  >
                    Nombre
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: "#000" }}
                  />

                  <label
                    className="text-sm font-medium"
                    style={{ color: "#000" }}
                  >
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: "#000" }}
                  />

                  <label
                    className="text-sm font-medium"
                    style={{ color: "#000" }}
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: "#000" }}
                  />

                  <label
                    className="text-sm font-medium"
                    style={{ color: "#000" }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: "#000" }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={crearManager}
                    className="px-4 py-2 text-white rounded"
                    style={{ backgroundColor: estilosSafe.color_principal }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalSubirEmpleados && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
              onClick={() => setModalSubirEmpleados(false)}
            >
              <div
                className="bg-white p-6 rounded-2xl w-full sm:w-4/5 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-auto text-black"
                onClick={(e) => e.stopPropagation()}
              >
                <SubirEmpleados
                  onClose={() => setModalSubirEmpleados(false)}
                  onUpload={subirEmpleadosDesdeCSV}
                />
              </div>
            </div>
          )}

          {modalSubirMetricas && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
              onClick={() => setModalSubirMetricas(false)}
            >
              <div
                className="bg-white p-6 rounded-2xl w-full flex flex-col gap-4 sm:w-4/5 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-auto text-black"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold mb-4">
                  Subir Métricas de Desempeño
                </h2>
                <div className="space-y-2 flex flex-col gap-2">
                  <label
                    htmlFor="input-metricas"
                    className="text-sm font-medium text-gray-700"
                  >
                    Adjuntar archivo en formato CSV
                  </label>
                  {archivoMetricas ? (
                    <div className="flex justify-between items-center gap-2">
                      <div className="mt-2 flex items-center space-x-2 text-green-600">
                        <FileCheck className="w-5 h-5" />
                        <span className="text-sm">{archivoMetricas.name}</span>
                      </div>
                      <button
                        className="opacity-50 hover:opacity-100 transition"
                        onClick={() => setArchivoMetricas(null)}
                      >
                        <XCircle />
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed hover:bg-gray-100 border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-primary-500 transition-colors cursor-pointer">
                      <input
                        ref={inputMetricasRef}
                        id="input-metricas"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept=".csv"
                        type="file"
                        onChange={(e) => setArchivoMetricas(e.target.files[0])}
                      />
                      <div className="flex flex-col items-center text-gray-500">
                        <UploadCloud className="h-8 w-8 mb-1" />
                        <span className="text-sm">
                          Haz click o arrastra tu archivo CSV aquí
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <a
                    className="mx-auto text-indigo-500 hover:underline group text-xs flex items-center w-fit"
                    target="_blank"
                    href="https://docs.google.com/spreadsheets/d/1huAWWzslooGEnzRjIEd8jDAb-i16xrx-pEeXcfsf0Bo/edit?gid=1723363062#gid=1723363062"
                  >
                    Asegurate de seguir esta plantilla{" "}
                    <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition" />
                  </a>
                </div>
                {/* Mensaje de alerta si hay */}
                {mensajeMetricas && <MensajeAlerta texto={mensajeMetricas} />}

                {/* Botones de acción */}
                <div className="flex *:flex-1 gap-2">
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
                    disabled={archivoMetricas === null}
                    onClick={subirMetricasDesdeCSV}
                    className="px-4 py-2 bg-indigo-600 disabled:opacity-50 text-white rounded hover:bg-indigo-700"
                  >
                    Subir
                  </button>
                </div>
              </div>
            </div>
          )}

          <LicenciasACargoModal
            service={adminEmpService}
            open={modalLicenciasOpen}
            onOpenChange={setModalLicenciasOpen}
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
        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}
