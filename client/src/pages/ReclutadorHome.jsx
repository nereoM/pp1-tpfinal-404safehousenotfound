import { motion } from "framer-motion";
import { BarChart2, FilePlus, FileText, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ServerError } from "../common/error";
import PageLayout from "../components/PageLayout";
import { ProfileCard } from "../components/ProfileCard";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import { reclutadorService } from "../services/reclutadorService";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";

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
  const [filtros, setFiltros] = useState({nombre: '',email: '',is_apto: '',fecha_desde: '',fecha_hasta: ''});
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [cvUrl, setCvUrl] = useState(null);




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
        id:        data.id,
        nombre:    data.nombre,
        apellido:  data.apellido,
        username:  data.username,
        correo:    data.correo,
        roles:     data.roles,
        empresaId: data.id_empresa
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
    slogan: estilos?.slogan ?? "Bienvenido al panel de Administración de Empresa",
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mis-licencias`, {
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
    const url = `${import.meta.env.VITE_API_URL}/api/ver-cv/${idCv}`;
    setCvUrl(url);
    setCvModalOpen(true);
  };


  const acciones = [
    {
      icon: Users,
      titulo: "Ver Listado de Ofertas Asignadas",
      descripcion: "Accede a tu listado de ofertas asignadas en el sistema",
      onClick: openModalOfertas
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
      titulo: "Ver Empleados",
      descripcion: "Visualizá y administrá los empleados de tu empresa.",
      onClick: () => alert("Funcionalidad en desarrollo"),
    },
    {
      icon: BarChart2,
      titulo: "Visualizar Indicadores de Desempeño",
      descripcion: "Revisa los indicadores clave de desempeño de los empleados.",
      onClick: () => alert("Funcionalidad en desarrollo"),
    },
    {
      icon: FileText,
      titulo: "Visualizar Reportes",
      descripcion: "Revisa los KPIs del sistema.",
      onClick: () => alert("Funcionalidad en desarrollo"),
    },
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
                fotoUrl="https://i.postimg.cc/3x2SrWdX/360-F-64676383-Ldbmhi-NM6-Ypzb3-FM4-PPu-FP9r-He7ri8-Ju.webp"
                showCvLink={false}
                size="xl"
                style={{ borderColor: estilosSafe.color_principal }}
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4 text-black">
              <h2 className="text-xl font-semibold">Solicitud de Licencia</h2>

              {mensajeLicencia && (
                <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
                  {mensajeLicencia}
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Tipo de licencia</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="vacaciones, enfermedad, etc."
                    value={formLicencia.tipo}
                    onChange={(e) =>
                      setFormLicencia({ ...formLicencia, tipo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Motivo o detalles adicionales"
                    value={formLicencia.descripcion}
                    onChange={(e) =>
                      setFormLicencia({ ...formLicencia, descripcion: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setModalLicenciaOpen(false);
                    setMensajeLicencia("");
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={solicitarLicencia}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

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
              className="bg-white p-6 rounded-2xl w-1/3 max-h-[70vh] overflow-auto text-black"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold mb-4 text-center">
                Seleccionar Licencia y Subir Certificado
              </h2>


              {licencias.length === 0 ? (
                <p className="text-center text-gray-500">
                  No tienes licencias registradas.
                </p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {licencias.map((item, idx) => {
                    const { id_licencia, tipo, descripcion, estado } =
                      item.licencias.licencia;
                    return (
                      <li
                        key={idx}
                        onClick={() => setLicenciaId(id_licencia)}
                        className={`p-3 border rounded cursor-pointer hover:bg-indigo-200 ${licenciaId === id_licencia ? "bg-indigo-100" : ""
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{tipo}</span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${estado === "activa"
                                ? "bg-green-100 text-green-800"
                                : estado === "aprobada"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {estado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{descripcion}</p>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* sube el PDF <==> ya elegiste una licencia */}
              {licenciaId && (
                <>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4 file:rounded-lg
                       file:border-0 file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />

                  {mensajeCertificado && (
                    <div
                      className={`mb-4 mt-2 text-center font-semibold p-2 rounded ${mensajeCertificado.includes("Error")
                          ? "bg-red-100 text-red-700"
                          : "bg-indigo-100 text-indigo-700"
                        }`}
                    >
                      {mensajeCertificado}
                    </div>
                  )}

                  <div className="mt-4 text-right flex gap-2">
                    <button
                      onClick={async () => {
                        if (!selectedFile) {
                          setMensajeCertificado("Debes seleccionar un PDF.");
                          return;
                        }
                        const formData = new FormData();
                        formData.append("file", selectedFile);

                        try {
                          const res = await fetch(
                            `${import.meta.env.VITE_API_URL}/api/subir-certificado/${licenciaId}`,
                            {
                              method: "POST",
                              credentials: "include",
                              body: formData,
                            }
                          );
                          const data = await res.json();
                          if (res.ok) {
                            setMensajeCertificado(
                              `Certificado subido: ${data.certificado_url}`
                            );
                            setTimeout(() => {
                              setModalLicenciasOpen(false);
                              setLicenciaId(null);
                              setSelectedFile(null);
                              setMensajeCertificado("");
                            }, 1500);
                          } else {
                            setMensajeCertificado(`Error: ${data.error}`);
                          }
                        } catch {
                          setMensajeCertificado("Error al conectar con el servidor.");
                        }
                      }}
                      className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                      Subir
                    </button>
                    <button
                      onClick={() => {
                        setModalLicenciasOpen(false);
                        setLicenciaId(null);
                        setSelectedFile(null);
                        setMensajeCertificado("");
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
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

{modalPostulantesOpen && (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
    onClick={() => setModalPostulantesOpen(false)}
  >
    <div
      className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mx-4"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-semibold mb-4 text-black">Postulantes</h2>

<div className="p-4 border rounded-lg mb-4 bg-gray-800">
  <input
    type="text"
    placeholder="Nombre"
    value={filtros.nombre}
    onChange={(e) => {
      setFiltros({ ...filtros, nombre: e.target.value });
      filtrarPostulantes(e.target.value, filtros.email, filtros.is_apto, filtros.fecha_desde, filtros.fecha_hasta);
    }}
    className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full placeholder-gray-400"
  />
  <input
    type="text"
    placeholder="Email"
    value={filtros.email}
    onChange={(e) => {
      setFiltros({ ...filtros, email: e.target.value });
      filtrarPostulantes(filtros.nombre, e.target.value, filtros.is_apto, filtros.fecha_desde, filtros.fecha_hasta);
    }}
    className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full placeholder-gray-400"
  />
  <input
    type="date"
    value={filtros.fecha_desde}
    onChange={(e) => {
      setFiltros({ ...filtros, fecha_desde: e.target.value });
      filtrarPostulantes(filtros.nombre, filtros.email, filtros.is_apto, e.target.value, filtros.fecha_hasta);
    }}
    className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full"
  />
  <input
    type="date"
    value={filtros.fecha_hasta}
    onChange={(e) => {
      setFiltros({ ...filtros, fecha_hasta: e.target.value });
      filtrarPostulantes(filtros.nombre, filtros.email, filtros.is_apto, filtros.fecha_desde, e.target.value);
    }}
    className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full"
  />
  <select
    value={filtros.is_apto}
    onChange={(e) => {
      setFiltros({ ...filtros, is_apto: e.target.value });
      filtrarPostulantes(filtros.nombre, filtros.email, e.target.value, filtros.fecha_desde, filtros.fecha_hasta);
    }}
    className="border border-gray-600 bg-gray-700 text-white p-2 mb-2 w-full"
  >
    <option value="" className="text-white"> Apto </option>
    <option value="true" className="text-white">Sí</option>
    <option value="false" className="text-white">No</option>
  </select>
</div>


{postulantesFiltrados.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-10">
    <p className="text-gray-500 text-lg">No hay postulantes.</p>
    <p className="text-gray-400 text-sm">Aún no se ha registrado ningún postulante para esta oferta.</p>
  </div>
) : (
  <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
    {postulantesFiltrados.map((c, i) => (
      <li key={i} className="border-b pb-3 last:border-0 flex flex-col gap-1">
        <span className="font-medium text-black">{c.nombre}</span>
        <span className="text-sm text-gray-700">{c.email}</span>
        <span className="text-xs text-gray-500">
          {new Date(c.fecha_postulacion).toLocaleDateString()}
        </span>
        <span className={`text-xs font-semibold px-2 py-1 rounded w-max ${
          c.is_apto ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {c.is_apto ? "Apto" : "No Apto"}
        </span>

        {c.cv_url && (
          <a
            href={c.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-indigo-600 hover:underline text-sm w-max"
          >
            Ver CV
          </a>
        )}
      </li>
    ))}
  </ul>
)}
      <div className="mt-6 text-right">
        <button
          onClick={() => setModalPostulantesOpen(false)}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}




        {cvModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 overflow-y-auto"
            onClick={() => { setCvModalOpen(false); setCvUrl(null); }}
          >
            <div
              className="bg-white p-4 rounded-lg shadow-lg w-full max-w-3xl h-[80vh] mx-4 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-black">Previsualizar CV</h3>
                <button
                  onClick={() => { setCvModalOpen(false); setCvUrl(null); }}
                  className="text-gray-600 hover:text-gray-800 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              {cvUrl ? (
                <object data={cvUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="flex-1 border">
                  <p className="text-center text-gray-500">
                    Tu navegador no soporta PDF embebido.&nbsp;
                    <a href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline">
                      Descargar CV
                    </a>
                  </p>
                </object>
              ) : (
                <p className="text-center text-gray-500">Cargando visor…</p>
              )}
            </div>
          </div>
        )}




      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}