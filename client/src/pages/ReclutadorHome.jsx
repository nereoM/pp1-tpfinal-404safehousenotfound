import { motion } from "framer-motion";
import { BarChart2, FilePlus, FileText, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalParaEditarPerfil from "../components/ModalParaEditarPerfil.jsx";
import PageLayout from "../components/PageLayout";
import { ProfileCard } from "../components/ProfileCard";
import { SolicitarLicenciaModal } from "../components/SolicitarLicenciaModal.jsx";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { reclutadorService } from '../services/reclutadorService.js';
import ModalPostulantes from '../components/ModalPostulantes';
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



  const empresaId = user?.empresaId;
  const { estilos, loading: loadingEstilos } = useEmpresaEstilos(empresaId);

  const estilosSafe = {
    color_principal: estilos?.color_principal ?? "#2563eb",
    color_secundario: estilos?.color_secundario ?? "#f3f4f6",
    color_texto: estilos?.color_texto ?? "#000000",
    slogan: estilos?.slogan ?? "Bienvenido al panel de Reclutador",
    logo_url: estilos?.logo_url ?? null,
  };


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
      setMensajeOfertas(`${err.message}`);
    }
  };

  const solicitarLicencia = async () => {
    // Validaciones
    if (!formLicencia.tipo || formLicencia.tipo.trim().length < 5) {
      setMensajeLicencia("El tipo de licencia debe tener al menos 5 caracteres.");
      return;
    }
    if (!formLicencia.descripcion || formLicencia.descripcion.trim().length < 5) {
      setMensajeLicencia("La descripción debe tener al menos 5 caracteres.");
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
        setMensajeLicencia("Solicitud enviada correctamente.");
        setFormLicencia({ tipo: "", descripcion: "" });
      } else {
        setMensajeLicencia(`Error: ${data.error}`);
      }
    } catch (err) {
      setMensajeLicencia("Error al conectar con el servidor.");
    }
  };


  const openModalOfertas = () => {
    setMensajeOfertas("");
    fetchOfertasAsignadas();
    setModalOfertasOpen(true);
  };


  // func para obtener licencias 
  const fetchLicencias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mis-licencias-reclutador`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Licencias obtenidas:", data);
        setLicencias(data);
        setModalLicenciasOpen(true);
      } else {
        console.error("Error al obtener licencias:", data.error);
      }
    } catch (err) {
      console.error("Error al conectar con el servidor:", err);
    }
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
      setMensajeCertificado("Debes seleccionar un archivo PDF.");
      return;
    }

    if (!licenciaId) {
      setMensajeCertificado("No se encontró la licencia a la cual subir el certificado.");
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
        setMensajeCertificado(`Certificado subido correctamente`);
        setModalLicenciasOpen(false);
      } else {
        setMensajeCertificado(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error al subir el certificado:", error);
      setMensajeCertificado("Error al conectar con el servidor.");
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
        setMensajeEtiquetas("Etiquetas actualizadas");
        // refresca la lista de ofertas
        fetchOfertasAsignadas();
        setTimeout(() => setModalEditarEtiquetasOpen(false), 1000);
      } else {
        setMensajeEtiquetas(`${data.error}`);
      }
    } catch {
      setMensajeEtiquetas("Error al conectar con el servidor");
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
      titulo: "Ver Listado de Ofertas Asignadas",
      descripcion: "Accede a tu listado de ofertas asignadas en el sistema",
      onClick: openModalOfertas
    },
    {
      icon: FileText,
      titulo: "Visualizar Reportes",
      descripcion: "Revisa los KPIs del sistema.",
      onClick: () => alert("Funcionalidad en desarrollo"),
    },
    {
      icon: FilePlus,
      titulo: "Cargar Licencias",
      descripcion: "Carga una nueva licencia.",
      onClick: () => setModalLicenciaOpen(true)
    },
    {
      icon: FilePlus,
      titulo: "Gestionar Licencias",
      descripcion: "Visualizá y administrá tus licencias cargadas.",
      onClick: fetchLicencias,
    },
    {
      icon: BarChart2,
      titulo: "Visualizar Indicadores de Desempeño y predicciones",
      descripcion: "Visualizá y administrá los empleados de tu empresa.",
      onClick: () => navigate("/reclutador/empleados-rendimiento"),
    },
    {
      icon: BarChart2,
      titulo: "Detección Temprana de Rotación y Riesgos Laborales",
      descripcion: "Identificá patrones que podrían anticipar despidos, renuncias o rotación de empleados.",
      onClick: () => navigate("/reclutador/empleados-riesgo"),
    }
  ];


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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="relative">
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

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="md:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-black">Acciones disponibles: Reclutador de RRHH</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {acciones.map(({ icon: Icon, titulo, descripcion, onClick }, idx) => (
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
                    <Icon className="w-6 h-6 mb-2" style={{ color: estilosSafe.color_texto }} />
                    <h3 className="text-base font-semibold">{titulo}</h3>
                    <p className="text-sm mt-1">{descripcion}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </PageLayout>

        {modalOfertasOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow space-y-4 text-black">
              <h2 className="text-xl font-semibold">Ofertas asignadas</h2>

              {mensajeOfertas && (
                <div className="text-sm text-indigo-700 bg-indigo-100 p-2 rounded">
                  {mensajeOfertas}
                </div>
              )}

              {ofertasAsignadas.length === 0 ? (
                <p>No hay ofertas asignadas.</p>
              ) : (
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {ofertasAsignadas.map((oferta) => (
                    <li key={oferta.id_oferta} className="p-4 border rounded shadow bg-gray-50">
                      <h3 className="font-semibold">{oferta.nombre}</h3>
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
                  ))}

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
            onClose={() => setModalLicenciaOpen(false)}
            service={reclutadorService}
          />
        )
        }

        {/* modal de gestionar licencias */}
        {modalLicenciasOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
            onClick={() => {
              setModalLicenciasOpen(false);
              setLicenciaId(null);
              setSelectedFile(null);
              setMensajeCertificado("");
            }}
          >
            <div
              className="bg-white p-6 rounded-2xl w-3/4 max-h-[70vh] overflow-auto text-black"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold mb-4 text-center">
                Mis Licencias
              </h2>

              {licencias.length === 0 ? (
                <p className="text-center text-gray-500">
                  No tienes licencias registradas.
                </p>
              ) : (
                <table className="w-full table-auto border border-gray-300 mb-4 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Tipo</th>
                      <th className="p-2 border">Descripción</th>
                      <th className="p-2 border">Estado</th>
                      <th className="p-2 border">Motivo Rechazo (si aplica)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licencias.map((licencia, idx) => {
                      const { tipo, descripcion, estado, motivo_rechazo } = licencia;
                      return (
                        <tr key={idx} className="hover:bg-indigo-50">
                          <td className="p-2 border">{tipo}</td>
                          <td className="p-2 border">{descripcion && descripcion.trim() !== "" ? descripcion : "-"}</td>
                          <td className="p-2 border capitalize">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${estado === "activa"
                                ? "bg-green-100 text-green-800"
                                : estado === "aprobada" || estado === "pendiente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                                }`}
                            >
                              {estado}
                            </span>
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {estado === "rechazada" ? (
                              <span className="text-sm text-red-500 italic">
                                {motivo_rechazo ?? "Sin motivo especificado"}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <div className="mt-4 text-right">
                <button
                  onClick={() => {
                    setModalLicenciasOpen(false);
                    setLicenciaId(null);
                    setSelectedFile(null);
                    setMensajeCertificado("");
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

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
                {nuevasEtiquetas.length < 3 ? (
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
                ) : (
                  <p className="text-sm text-red-600">
                    Has alcanzado el máximo de 3 etiquetas.
                  </p>
                )}
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