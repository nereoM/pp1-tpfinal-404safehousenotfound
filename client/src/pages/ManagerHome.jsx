import { motion } from "framer-motion";
import { BarChart, BarChart2, FileLock, FileText, FileUp, PlusCircle, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GestionUsuarios from "../components/GestionUsuarios.jsx";
import { LicenciasACargoModal } from "../components/LicenciasEmpleadosReclutadoresModal.jsx";
import ModalOferta from '../components/ModalOferta';
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";
import PageLayout from "../components/PageLayout";
import { ProfileCard } from "../components/ProfileCard";
import RendimientoAnalistasTable from "../components/RendimientoAnalistasTable";
import { SolicitarLicenciaModal } from "../components/SolicitarLicenciaModal.jsx";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { managerService } from "../services/managerService.js";

import MensajeAlerta from "../components/MensajeAlerta"; // alertas


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
  const [formAnalista, setFormAnalista] = useState({ nombre: "", apellido: "", username: "", email: "" });
  const [ofertas, setOfertas] = useState([]);
  const [analistas, setAnalistas] = useState([]);
  const [selectedAnalistas, setSelectedAnalistas] = useState({});

const [ofertasAsignadas, setOfertasAsignadas] = useState(new Set()); // facu


  const [modalLicenciasOpen, setModalLicenciasOpen] = useState(false);
  const [modalRechazoOpen, setModalRechazoOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [licencias, setLicencias] = useState([]);
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);
  const [mensajeLicencias, setMensajeLicencias] = useState("");
  const [mensajeEvaluacion, setMensajeEvaluacion] = useState("");
  const [modalEditarPerfilOpen, setModalEditarPerfilOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [username, setUsername] = useState("");
  const [modalImageFile, setModalImageFile] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  const [modalGestionEquipo, setModalGestionEquipo] = useState(false);
  const navigate = useNavigate();
  const [modalSubirMetricas, setModalSubirMetricas] = useState(false);
  const [mensajeMetricas, setMensajeMetricas] = useState("");
  const [archivoMetricas, setArchivoMetricas] = useState(null);
  const [modalRendimientoAnalistas, setModalRendimientoAnalistas] = useState(false);
  const [modalSubirEmpleados, setModalSubirEmpleados] = useState(false);
  const [mensajeEmpleados, setMensajeEmpleados] = useState("");
  const [archivoEmpleados, setArchivoEmpleados] = useState(null);
  const inputEmpleadosRef = useRef();

  // Modal
  const [modalSolicitarLicencia, setModalSolicitarLicencia] = useState(false)

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
        // data ahora tiene { id, nombre, apellido, username, correo, roles, id_empresa }
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

  const subirMetricasDesdeCSV = async () => {
    if (!archivoMetricas) {
      setMensajeMetricas("Selecciona un archivo CSV.");
      return;
    }
    setMensajeMetricas("Subiendo archivo...");
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
        setMensajeMetricas(data.message || "Archivo subido correctamente.");
      } else {
        setMensajeMetricas(data.error || "Error al subir el archivo.");
      }
    } catch (err) {
      setMensajeMetricas("Error de conexión.");
    }
  };

  const empresaId = user?.empresaId;
  const { estilos, loading: loadingEstilos } = useEmpresaEstilos(empresaId);

  const estilosSafe = {
    color_principal: estilos?.color_principal ?? "#2563eb",
    color_secundario: estilos?.color_secundario ?? "#f3f4f6",
    color_texto: estilos?.color_texto ?? "#000000",
    slogan: estilos?.slogan ?? "Bienvenido al panel de Manager",
    logo_url: estilos?.logo_url ?? null,
  };

  const subirEmpleadosDesdeCSV = async () => {
    if (!archivoEmpleados) {
      setMensajeEmpleados("Selecciona un archivo CSV.");
      return;
    }
    setMensajeEmpleados("Subiendo archivo...");
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
        setMensajeEmpleados(data.message || "Archivo subido correctamente.");
      } else {
        setMensajeEmpleados(data.error || "Error al subir el archivo.");
      }
    } catch (err) {
      setMensajeEmpleados("Error de conexión.");
    }
  };

  //funcion para crear una oferta laboral
  const crearOfertaLaboral = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crear_oferta_laboral`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formOferta),
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeOferta(`Oferta creada: ${data.nombre} (ID: ${data.id_oferta})`);
        setFormOferta({});
      } else {
        setMensajeOferta(`Error: ${data.error}`);
      }
    } catch (err) {
      setMensajeOferta("Error al conectar con el servidor");
    }
  };

  const crearAnalista = async () => {
    if (formAnalista.username.trim().length < 4) {
      setMensajeAnalista("El nombre de usuario debe tener al menos 4 caracteres.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrar-reclutador`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formAnalista.nombre,
          lastname: formAnalista.apellido,
          username: formAnalista.username,
          email: formAnalista.email,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensajeAnalista(
          `Analista creado: ${data.credentials.username}\nContraseña temporal: ${data.credentials.password}`
        );
        setFormAnalista({ nombre: "", apellido: "", username: "", email: "" });
      } else {
        setMensajeAnalista(`Error: ${data.error}`);
      }
    } catch (err) {
      setMensajeAnalista("Error al conectar con el servidor");
    }
  };

  //funcion para traer las ofertas que creo el manager
  const fetchMisOfertas = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mis-ofertas-laborales`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setOfertas(data.ofertas);
      else throw new Error(data.error || "Error al obtener ofertas");
    } catch (err) {
      setMensajeVerOferta(err.message);
    }
  };

  const fetchAnalistas = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/empleados-manager`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setAnalistas(data.filter((e) => e.roles.includes("reclutador")));
      else throw new Error("Error al obtener analistas");
    } catch (err) {
      setMensaje(err.message);
    }
  };

  const openModalVerOfertas = () => {
    fetchMisOfertas();
    fetchAnalistas();
    setModalVerOfertasOpen(true);
  };

  const openModalLicencias = () => {
    setMensajeLicencias("");
    obtenerLicencias();
    setModalLicenciasOpen(true);
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
      setMensajeAsignacion("Seleccione un analista antes de asignar.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/asignar-analista-oferta`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_oferta: ofertaId, id_analista: analistaId }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMensajeAsignacion(data.message);

        //  marcar como asignada
        setOfertasAsignadas(prev => new Set(prev).add(ofertaId));
      } else {
        throw new Error(data.error || data.message);
      }
    } catch (err) {
      setMensajeAsignacion(err.message);
    }
  };


  const obtenerLicencias = async () => {  
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/licencias-solicitadas-manager`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        setLicencias(data);
      } else {
        throw new Error(data.error || "Error al obtener licencias");
      }
    } catch (error) {
      console.error("Error al obtener las licencias:", error);
      setMensajeLicencias("Error al cargar las licencias.");
    }
  };

  const cerrarOferta = async (id_oferta) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cerrar_oferta/${id_oferta}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeAsignacion(data.message || "Oferta cerrada exitosamente.");
        // Refresca las ofertas para actualizar el estado
        fetchMisOfertas();
      } else {
        setMensajeAsignacion(data.error || "Error al cerrar la oferta.");
      }
    } catch (err) {
      setMensajeAsignacion("Error al conectar con el servidor.");
    }
  };

  const abrirModalRechazo = (licencia) => {
    setLicenciaSeleccionada(licencia);
    setModalRechazoOpen(true);
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
        alert("Imagen subida exitosamente");
        setUser((prev) => ({ ...prev, fotoUrl: result.file_path }));
        setModalEditarPerfilOpen(false);
      } else {
        alert("Error: " + (result.error || "desconocido"));
      }
    } catch (err) {
      console.error("Error al subir imagen:", err);
      alert("Error de conexión");
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
    } catch (err) {
      alert(err.message);
    }
  };



  const acciones = [
    {
      icon: Users,
      titulo: "Ver Listado de Ofertas",
      descripcion: "Accede al listado de ofertas disponibles en el sistema.",
      onClick: openModalVerOfertas,
    },
    {
      icon: FileText,
      titulo: "Subir Empleados por CSV",
      descripcion: "Carga empleados en lote desde un archivo CSV.",
      onClick: () => setModalSubirEmpleados(true),
    },
    {
      icon: PlusCircle,
      titulo: "Publicar una Nueva Oferta",
      descripcion: "Crea y publica nuevas ofertas en el sistema.",
      onClick: () => setModalOfertaOpen(true),
    },
    {
      icon: BarChart,
      titulo: "Crear Analista",
      descripcion: "Registrá nuevos analistas para tu empresa.",
      onClick: () => setModalAnalistaOpen(true),
    },
    {
      icon: BarChart2,
      titulo: "Subir Métricas de Analistas",
      descripcion: "Carga un archivo CSV con métricas de desempeño y rotación de analistas.",
      onClick: () => setModalSubirMetricas(true),
    },
    {
      icon: Users,
      titulo: "Gestionar equipo",
      descripcion: "Visualizá y administrá los analistas a tu cargo",
      onClick: () => setModalGestionEquipo(true),
    },
    {
      icon: FileUp,
      titulo: "Solicitar Licencia",
      descripcion: "Solicituar una nueva licencia.",
      onClick: () => setModalSolicitarLicencia(true),
    },
    {
      icon: FileLock,
      titulo: "Consultar Licencias",
      descripcion: "Accede a las licencias del personal y sus estados.",
      onClick: openModalLicencias
    },
        {
      icon: BarChart2,
      titulo: "Editar Métricas de Analistas",
      descripcion: "Visualizá y editá las métricas de tus analistas en una tabla interactiva.",
      onClick: () => setModalRendimientoAnalistas(true),
    },
    {
      icon: BarChart2,
      titulo: "Visualizar Indicadores de Desempeño y predicciones",
      descripcion: "Visualizá y administrá los empleados de tu empresa.",
      onClick: () => navigate('/manager/empleados-rendimiento-analistas'),
    },
    {
      icon: BarChart2,
      titulo: "Detección Temprana de Rotación y Riesgos Laborales",
      descripcion: "Identificá patrones que podrían anticipar despidos, renuncias o rotación de empleados.",
      onClick: () => navigate("/manager/analistas-riesgo"),
    },
  ];

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

  if (loadingUser)
    return <div className="p-10 text-center">Cargando usuario…</div>;
  if (!user)
    return (
      <div className="p-10 text-center text-red-600">
        No se pudo cargar el usuario.
      </div>
    );

  const etiquetasCampos = {
    nombre: "Nombre",
    descripcion: "Descripción",
    location: "Ubicación",
    employment_type: "Tipo de empleo",
    workplace_type: "Modalidad",
    salary_min: "Salario mínimo",
    salary_max: "Salario máximo",
    currency: "Moneda",
    experience_level: "Nivel de experiencia",
    etiquetas: "Etiquetas",
    fecha_cierre: "Fecha de cierre",
  };

  return (
    <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
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
                fotoUrl={user?.foto_url ? user.foto_url : "https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg"}
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
              <h2 className="text-lg font-semibold text-black">
                Acciones disponibles: Manager de RRHH
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
                ))}
              </div>
            </motion.div>
          </div>

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
                <MensajeAlerta texto={mensajeAnalista} />
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
                <RendimientoAnalistasTable onSuccess={() => setModalRendimientoAnalistas(false)} />
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
                
                <MensajeAlerta texto={mensajeAsignacion} />


                <h2 className="text-2xl font-semibold mb-4">Mis Ofertas</h2>

                {ofertas.length === 0 ? (
                  <p>No hay ofertas disponibles.</p>
                ) : (
                  // 🔼 LÍNEA AGREGADA: contenedor scrolleable para la tabla
                  <div className="flex-1 overflow-auto">
                    <table className="min-w-full table-auto border-collapse text-black">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 text-left">Nombre</th>
                          <th className="px-4 py-2 text-left">Descripción</th>
                          <th className="px-4 py-2 text-left">Asignar Analista</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ofertas.map(o => {
                          const estaAsignada = ofertasAsignadas.has(o.id_oferta); //  Fue asignado con el botón
                          const analistaSeleccionado = selectedAnalistas[o.id_oferta]; //  Hay algo seleccionado

                          // 🎨 Lógica de color e ícono
                          let claseColor = "";
                          let icono = "";
                          let tooltip = "";

                          if (!o.is_active) {
                            claseColor = "bg-red-100 text-red-800";
                            icono = "🛑";
                            tooltip = "Oferta cerrada";
                          } else if (estaAsignada) {
                            claseColor = "bg-green-100 text-green-800";
                            icono = "✅";
                            tooltip = "Analista asignado";
                          } else if (analistaSeleccionado && analistaSeleccionado !== "") {

                            claseColor = "bg-orange-200 text-orange-800";
                            icono = "⏳";
                            tooltip = "Analista seleccionado pero no asignado";
                          } else {
                            claseColor = "bg-yellow-100 text-yellow-800";
                            icono = "⚠️";
                            tooltip = "Sin analista asignado";
                          }

                          return (
                            <tr key={o.id_oferta} className={`border-t ${claseColor}`}>
                              <td className="px-4 py-2 flex items-center gap-2">
                                <span title={tooltip}>{icono}</span> {o.nombre}
                              </td>
                              <td className="px-4 py-2">{o.descripcion}</td>
                              <td className="px-4 py-2 flex items-center gap-2">
                                <select
                                  value={selectedAnalistas[o.id_oferta] || ""}
                                  onChange={e => handleSelectAnalista(o.id_oferta, e.target.value)}
                                  className="border px-2 py-1 rounded mr-2 text-black"
                                  disabled={o.is_active === false || estaAsignada} // ⛔️ Bloqueado si cerrada o asignada
                                >
                                  <option value="">Seleccione analista</option>
                                  {analistas.map(a => (
                                    <option key={a.id} value={a.id}>{a.username}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => asignarAnalista(o.id_oferta)}
                                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                  disabled={!o.is_active || estaAsignada} // ⛔️ Bloqueado si cerrada o ya asignada
                                >
                                  Asignar
                                </button>
                                {o.is_active !== false && (
                                  <button
                                    onClick={() => cerrarOferta(o.id_oferta)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700 transition"
                                  >
                                    Cerrar
                                  </button>
                                )}
                                {o.is_active === false && (
                                  <span className="ml-2 text-xs text-red-600 font-semibold">Oferta cerrada</span>
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
                      setSelectedAnalistas(prev => {
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

          {modalLicenciasOpen && <LicenciasACargoModal onClose={() => setModalLicenciasOpen(false)} />}

          {modalSolicitarLicencia && <SolicitarLicenciaModal  onClose={() => setModalSolicitarLicencia(false)}/>}

          {modalLicenciasOpen && <LicenciasEmpleadosReclutadoresModal onClose={() => setModalLicenciasOpen(false)} />}
            

          {modalSubirEmpleados && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-2xl w-full sm:w-4/5 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-auto text-black">
                <h2 className="text-lg font-semibold mb-4">Subir Empleados por CSV</h2>
                <input
                  type="file"
                  accept=".csv"
                  ref={inputEmpleadosRef}
                  onChange={e => setArchivoEmpleados(e.target.files[0])}
                  className="mb-4"
                />
                {mensajeEmpleados && (
                  <div className="mb-2 text-sm text-center text-indigo-700">{mensajeEmpleados}</div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setModalSubirEmpleados(false);
                      setMensajeEmpleados("");
                      setArchivoEmpleados(null);
                      if (inputEmpleadosRef.current) inputEmpleadosRef.current.value = "";
                    }}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
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
                <h2 className="text-lg font-semibold mb-4">Subir Métricas de Analistas</h2>
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setArchivoMetricas(e.target.files[0])}
                  className="mb-4"
                />
                {mensajeMetricas && (
                  <div className="mb-2 text-sm text-center text-indigo-700">{mensajeMetricas}</div>
                )}
                <div className="flex justify-end gap-2">
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
                <div className="mt-4 text-xs text-gray-500">
                  El archivo debe tener las columnas: <br />
                  <b>id_empleado, desempeno_previo, cantidad_proyectos, tamano_equipo, horas_extras, antiguedad, horas_capacitacion, ausencias_injustificadas, llegadas_tarde, salidas_tempranas</b>
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

          {modalGestionEquipo &&
            <GestionUsuarios
              service={managerService}
              onClose={() => setModalGestionEquipo(false)}
              textColor={estilosSafe.color_texto} />}


        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}