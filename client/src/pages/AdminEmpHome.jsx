import { AnimatePresence, motion } from "framer-motion";
import { FileLock, Settings, Upload, UserPlus, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccionesPorSeccion } from "../components/AccionesPorSeccion.jsx";
import GestionUsuarios from "../components/GestionUsuarios";
import { LicenciasACargoModal } from "../components/LicenciasEmpleadosReclutadoresModal.jsx";
import MensajeAlerta from "../components/MensajeAlerta";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";
import PageLayout from "../components/PageLayout";
import PreferenciasEmpresa from "../components/PreferenciasEmpresa";
import SubirEmpleados from "../components/RegistrarEmpleados";
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
  const [formData, setFormData] = useState({ nombre: "", apellido: "", username: "", email: "" });
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
  const [mensajeError, setMensajeError] = useState('');
  const [modalSubirMetricas, setModalSubirMetricas] = useState(false);
  const [mensajeMetricas, setMensajeMetricas] = useState("");
  const [archivoMetricas, setArchivoMetricas] = useState(null);
  const [toasts, setToasts] = useState([]);
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
  const showToast = React.useCallback((message, type = "success", duration = 3500) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
  // --- FIN HOOKS ---

  // --- IFs DE CARGA ---
  if (loadingUser) return <div className="p-10 text-center">Cargando usuario…</div>;
  if (!user) return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;
  if (loadingEstilos) return <div className="p-10 text-center">Cargando preferencias de empresa…</div>;
  // --- FIN IFs DE CARGA ---

  // --- RESTO DE LA LÓGICA Y RETURN ---
  const estilosSafe = {
    color_principal: estilos?.color_principal ?? "#2563eb",
    color_secundario: estilos?.color_secundario ?? "#f3f4f6",
    color_texto: estilos?.color_texto ?? "#000000",
    slogan: estilos?.slogan ?? "Bienvenido al panel de Administración de Empresa",
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

  const obtenerLicencias = async () => {
    adminEmpService
      .obtenerLicenciasSolicitadas()
      .then(setLicencias)
      .catch(() => showToast("Error al cargar las licencias.", "error"));
  };

  const evaluarLicencia = async (id_licencia, nuevoEstado) => {
    try {
      const payload = { estado: nuevoEstado };
      if (nuevoEstado === "rechazada") {
        payload.motivo = motivoRechazo;
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/licencia-${id_licencia}-empleado/evaluacion`,
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
        showToast(data.message || "Estado actualizado correctamente.", "success");
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
      showToast(data.message || "Empleados registrados correctamente.", "success");
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
      showToast("El nombre de usuario debe tener al menos 4 caracteres.", "error");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast("El correo electrónico no es válido.", "error");
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/registrar-manager`, {
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
      });
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
        descripcion: "Carga un archivo CSV con métricas de desempeño y rotación.",
        onClick: () => setModalSubirMetricas(true),
      },
    ],
  };

  return (
    <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe, loading: loadingEstilos }}>
      <Toast toasts={toasts} removeToast={removeToast} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
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

          {/* Centralizar acciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
            <div className="md:col-span-3 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-3xl space-y-4"
              >
                <h2 className="text-lg font-semibold" style={{ color: estilosSafe.color_texto, textAlign: "center" }}>
                  Acciones disponibles: Administrador de Empresa
                </h2>
                <AccionesPorSeccion accionesPorSeccion={accionesPorSeccion} estilos={estilosSafe} />
              </motion.div>
            </div>
          </div>

          {modalUsuarios && <GestionUsuarios service={adminEmpService} onClose={() => setModalUsuarios(false)} textColor={estilosSafe.color_texto} />}

          {modalPreferencias && (
            <PreferenciasEmpresa
              idEmpresa={empresaId}
              onClose={() => setModalPreferencias(false)}
              estilosEmpresa={estilosSafe}
              onActualizar={handleActualizarEstilos}
            />
          )}

          {modalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: "#000" }}>Nuevo Manager</h2>

                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: "#000" }}>Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: "#000" }}
                  />

                  <label className="text-sm font-medium" style={{ color: "#000" }}>Apellido</label>
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: "#000" }}
                  />

                  <label className="text-sm font-medium" style={{ color: "#000" }}>Username</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: "#000" }}
                  />

                  <label className="text-sm font-medium" style={{ color: "#000" }}>Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: "#000" }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-2xl w-full sm:w-4/5 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-auto text-black">
                <SubirEmpleados onUpload={subirEmpleadosDesdeCSV} />
                <div className="mt-6 text-right">
                  <button
                    onClick={() => setModalSubirEmpleados(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalSubirMetricas && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-2xl w-full sm:w-4/5 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-auto text-black">
                <h2 className="text-lg font-semibold mb-4">Subir Métricas de Desempeño</h2>

                {/* Input de archivo */}
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setArchivoMetricas(e.target.files[0])}
                  className="mb-2"
                />

                {/* Botón separado para subir */}
                <div className="mb-4">
                  <button
                    onClick={subirMetricasDesdeCSV}
                    className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  >
                    Subir archivo
                  </button>
                </div>

                {/* Mensaje de alerta */}
                {mensajeMetricas && (
                  <MensajeAlerta texto={mensajeMetricas} />
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setModalSubirMetricas(false);
                      setMensajeMetricas("");
                      setArchivoMetricas(null);
                    }}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
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
                    id_empleado, desempeno_previo, cantidad_proyectos, tamano_equipo, horas_extras,
                    antiguedad, horas_capacitacion, ausencias_injustificadas, llegadas_tarde, salidas_tempranas
                  </b>
                </div>
              </div>
            </div>
          )}

          {
            modalLicenciasOpen && <LicenciasACargoModal service={adminEmpService} onClose={() => setModalLicenciasOpen(false)} />
          }

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