import { motion } from "framer-motion";
import { Edit, FileLock, Settings, UserPlus, Users, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GestionUsuarios from "../components/GestionUsuarios";
import PageLayout from "../components/PageLayout";
import PreferenciasEmpresa from "../components/PreferenciasEmpresa";
import { ProfileCard } from "../components/ProfileCard";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { adminEmpService } from "../services/adminEmpService";
import SubirEmpleados from "../components/RegistrarEmpleados";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminEmpHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [modalPreferencias, setModalPreferencias] = useState(false);
  const [mensaje, setMensaje] = useState("");
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

  const handleActualizarEstilos = () => {
    setModalPreferencias(false);
    setTimeout(() => window.location.reload(), 300);
  };

  if (loadingUser) return <div className="p-10 text-center">Cargando usuario…</div>;
  if (!user) return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;
  if (loadingEstilos) return <div className="p-10 text-center">Cargando preferencias de empresa…</div>;

  const estilosSafe = {
    color_principal: estilos?.color_principal ?? "#2563eb",
    color_secundario: estilos?.color_secundario ?? "#f3f4f6",
    color_texto: estilos?.color_texto ?? "#000000",
    slogan: estilos?.slogan ?? "Bienvenido al panel de Administración de Empresa",
    logo_url: estilos?.logo_url ?? null,
  };

  const obtenerLicencias = async () => {
    adminEmpService
      .obtenerLicenciasSolicitadas()
      .then(setLicencias)
      .catch(() => setMensajeLicencias("Error al cargar las licencias."));
  };

  const evaluarLicencia = async (id_licencia, nuevoEstado) => {
    try {
      const payload = { idLicencia: id_licencia, estado: nuevoEstado };
      if (nuevoEstado === "rechazada") {
        payload.motivo = motivoRechazo; 
      }

      const data = await adminEmpService.evaluarLicencia(payload);
      setMensajeEvaluacion(data.message || "Estado actualizado correctamente.");
      setMotivoRechazo("");
      obtenerLicencias();
    } catch (error) {
      console.error("Error al evaluar licencia:", error);
      setMensajeEvaluacion("Error al procesar la solicitud.");
    }
  };

  const abrirModalRechazo = (licencia) => {
    setLicenciaSeleccionada(licencia);
    setModalRechazoOpen(true);
  };

  const subirEmpleadosDesdeCSV = async (file) => {
    try {
      const data = await adminEmpService.registrarEmpleadosDesdeCSV(file);
      alert(data.message || "Empleados registrados correctamente.");
    } catch (error) {
      console.error("Error al subir empleados:", error);
      alert("Error al registrar empleados.");
    }
  };

  const crearManager = async () => {
    // Validaciones de los campos
    if (!formData.nombre.trim() || formData.nombre.trim().length < 2) {
      setMensaje("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!formData.apellido.trim() || formData.apellido.trim().length < 2) {
      setMensaje("El apellido debe tener al menos 2 caracteres.");
      return;
    }
    if (!formData.username.trim() || formData.username.trim().length < 4) {
      setMensaje("El nombre de usuario debe tener al menos 4 caracteres.");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMensaje("El correo electrónico no es válido.");
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

      // Mostrar mensaje de éxito
      setMensaje(
        `Usuario creado correctamente.\n\nUsername: ${data.credentials.username}\nContraseña temporal: ${data.credentials.password}`
      );

      // Limpiar el formulario
      setFormData({ nombre: "", apellido: "", username: "", email: "" });
    } catch (error) {
      console.error("Error al registrar manager:", error);
      setMensaje(error.message || "Error al conectar con el servidor.");
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
  } catch (err) {
    alert( err.message);
  }
};

  const acciones = [
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
    {
      icon: Settings,
      titulo: "Configurar Empresa",
      descripcion: "Ajustes de estilo y datos empresariales.",
      onClick: () => setModalPreferencias(true),
    },
    {
      icon: FileLock,
      titulo: "Consultar Licencias",
      descripcion: "Accede a las licencias del personal y sus estados.",
      onClick: () => {
        setMensajeLicencias("");
        obtenerLicencias();
        setModalLicenciasOpen(true);
      },
    },
    {
      icon: Upload,
      titulo: "Subir Empleados",
      descripcion: "Carga un archivo CSV para registrar empleados.",
      onClick: () => setModalSubirEmpleados(true),
    },
  ];

  return (
    <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe, loading: loadingEstilos }}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <ProfileCard
                nombre={`${user?.nombre} ${user?.apellido}`}
                correo={user?.correo}
                fotoUrl="https://i.postimg.cc/3x2SrWdX/360-F-64676383-Ldbmhi-NM6-Ypzb3-FM4-PPu-FP9r-He7ri8-Ju.webp"
                showCvLink={false}
                size="xl"
                style={{ borderColor: estilosSafe.color_principal }}
                textColor={estilosSafe.color_texto}
                onEdit={() => setModalEditarPerfilOpen(true)}
              />

            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="md:col-span-2 space-y-4"
            >
              <h2 className="text-lg font-semibold" style={{ color: estilosSafe.color_texto }}>
                Acciones disponibles: Administrador de Empresa
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {acciones.map(({ icon: Icon, titulo, descripcion, onClick }, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    onClick={onClick}
                    className="cursor-pointer border p-5 rounded-xl shadow-sm hover:shadow-md"
                    style={{
                      backgroundColor: estilosSafe.color_secundario,
                      borderColor: estilosSafe.color_principal,
                      color: estilosSafe.color_texto,
                    }}
                  >
                    <Icon className="w-6 h-6 mb-2" style={{ color: estilosSafe.color_principal }} />
                    <h3 className="text-base font-semibold" style={{ color: estilosSafe.color_texto }}>
                      {titulo}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: estilosSafe.color_texto }}>
                      {descripcion}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {modalUsuarios && <GestionUsuarios onClose={() => setModalUsuarios(false)} textColor={estilosSafe.color_texto} />}

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

                {mensaje && (
                  <div className="rounded p-2 text-sm text-left whitespace-pre-wrap" style={{ backgroundColor: "#f0f4ff", color: "#000" }}>
                    {mensaje}
                  </div>
                )}

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

          {modalLicenciasOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-2xl w-4/5 max-h-[80vh] overflow-auto text-black">
                <h2 className="text-2xl font-semibold mb-4 text-center">Mis Licencias</h2>

                {mensajeLicencias && (
                  <div className="mb-4 text-center text-red-600 font-semibold">
                    {mensajeLicencias}
                  </div>
                )}

                {mensajeEvaluacion && (
                  <div className="mb-4 text-center text-indigo-700 font-semibold bg-indigo-100 p-2 rounded">
                    {mensajeEvaluacion}
                  </div>
                )}

                {licencias.length === 0 ? (
                  <p className="text-center text-gray-500">No hay licencias solicitadas.</p>
                ) : (
                  <table className="min-w-full table-auto border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left border-b">Empleado</th>
                        <th className="px-4 py-2 text-left border-b">Tipo</th>
                        <th className="px-4 py-2 text-left border-b">Descripción</th>
                        <th className="px-4 py-2 text-left border-b">Fecha de Inicio</th>
                        <th className="px-4 py-2 text-left border-b">Estado</th>
                        <th className="px-4 py-2 text-left border-b">Certificado</th>
                        <th className="px-4 py-2 text-left border-b">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licencias.map((item, index) => {
                        const licencia = item.licencia;
                        const empleado = licencia.empleado;

                        return (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">
                              {empleado.nombre} {empleado.apellido}
                            </td>
                            <td className="px-4 py-2">{licencia.tipo}</td>
                            <td className="px-4 py-2">{licencia.descripcion}</td>
                            <td className="px-4 py-2">{licencia.fecha_inicio || "-"}</td>
                            <td className="px-4 py-2">{licencia.estado}</td>
                            <td className="px-4 py-2">
                              {licencia.certificado_url ? (
                                <a
                                  href={`${import.meta.env.VITE_API_URL}/${licencia.certificado_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 underline"
                                >
                                  Ver certificado
                                </a>
                              ) : (
                                "Sin certificado"
                              )}
                            </td>
                            <td className="px-4 py-2 space-x-2">
                              {licencia.estado === "pendiente" ? (
                                <>
                                  <button
                                    onClick={() => evaluarLicencia(licencia.id_licencia, "aprobada")}
                                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                  >
                                    Aprobar
                                  </button>
                                  <button
                                    onClick={() => abrirModalRechazo(licencia)}
                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                  >
                                    Rechazar
                                  </button>
                                </>
                              ) : licencia.estado === "aprobada" && licencia.certificado_url ? (
                                <button
                                  onClick={() => evaluarLicencia(licencia.id_licencia, "activa")}
                                  className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                                >
                                  Validar
                                </button>
                              ) : (
                                <span className="text-gray-500 italic">
                                  Licencia ya evaluada ({licencia.estado})
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {modalRechazoOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow space-y-4">
                      <h2 className="text-lg font-semibold">Indique el motivo del rechazo</h2>
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded resize-none"
                        rows="4"
                        placeholder="Escriba el motivo del rechazo..."
                        value={motivoRechazo}
                        onChange={(e) => {
                          setMotivoRechazo(e.target.value);
                          setMensajeError('');  // Limpiar el mensaje de error al escribir
                        }}
                      ></textarea>

                      {/* Mostrar mensaje de error si no se indica motivo */}
                      {mensajeError && <p className="text-red-500 text-sm">{mensajeError}</p>}

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setModalRechazoOpen(false)}
                          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            if (motivoRechazo.trim()) {
                              evaluarLicencia(licenciaSeleccionada.id_licencia, "rechazada");
                              setModalRechazoOpen(false);
                            } else {
                              setMensajeError("Debe indicar un motivo para rechazar la licencia.");
                            }
                          }}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-right">
                  <button
                    onClick={() => {
                      setModalLicenciasOpen(false);
                      setMensajeLicencias("");
                      setMensajeEvaluacion("");
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cerrar
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
          
        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}