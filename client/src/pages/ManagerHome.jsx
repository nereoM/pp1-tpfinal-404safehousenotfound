import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { Users, PlusCircle, BarChart, FileText, RotateCcw, FileLock } from 'lucide-react';

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
  const [modalLicenciasOpen, setModalLicenciasOpen] = useState(false);
  const [licencias, setLicencias] = useState([]);
  const [mensajeLicencias, setMensajeLicencias] = useState("");  
  const [mensajeEvaluacion, setMensajeEvaluacion] = useState("");
  const navigate = useNavigate();


  //trae los datos del manager
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/info-manager`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Error al autenticar");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => console.error("Error al obtener usuario:", err))
      .finally(() => setLoadingUser(false));
  }, []);

  const estilosSafe = {
    color_principal: "#2563eb",
    color_secundario: "#f3f4f6",
    color_texto: "#000000",
    slogan: "Bienvenido al panel de administración de Manager",
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
    setSelectedAnalistas((prev) => ({ ...prev, [ofertaId]: analistaId }));
  };

  const asignarAnalista = async (ofertaId) => {
    const analistaId = selectedAnalistas[ofertaId];
    if (!analistaId) return setMensajeAsignacion("Seleccione un analista antes de asignar.");
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
      if (res.ok) setMensajeAsignacion(data.message);
      else throw new Error(data.error || data.message);
    } catch (err) {
      setMensajeAsignacion(err.message);
    }
  };

  const obtenerLicencias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/visualizar-licencias-solicitadas`, {
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

  const evaluarLicencia = async (id_licencia, nuevoEstado) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluar-licencia/${id_licencia}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setMensajeEvaluacion(`${data.message}`);
        //refrescar la lista de licencias
        obtenerLicencias(); 
      } else {
        setMensajeEvaluacion(`${data.error}`);
      }
    } catch (error) {
      console.error("Error al evaluar licencia:", error);
      setMensajeEvaluacion(" Error al procesar la solicitud.");
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
      icon: RotateCcw,
      titulo: "Ver Análisis de Rotación",
      descripcion: "Consulta los indicadores relacionados con la rotación de personal.",
      onClick: () => alert("Funcionalidad en desarrollo"),
    },
    {
      icon: FileLock,
      titulo: "Consultar Licencias",
      descripcion: "Accede a las licencias del personal y sus estados.",
      onClick: openModalLicencias
    },    
    {
      icon: FileText,
      titulo: "Ver Reportes",
      descripcion: "Revisa los informes y reportes detallados del sistema.",
      onClick: () => alert("Funcionalidad en desarrollo"),
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
                fotoUrl={
                  "https://i.postimg.cc/3x2SrWdX/360-F-64676383-Ldbmhi-NM6-Ypzb3-FM4-PPu-FP9r-He7ri8-Ju.webp"
                }
                showCvLink={false}
                size="xl"
                style={{ borderColor: estilosSafe.color_principal }}
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

          {modalOfertaOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow space-y-4">

          {mensajeOferta && (
            <div className="text-sm text-indigo-700 bg-indigo-100 p-2 rounded">
              {mensajeOferta}
            </div>
          )}
               

                <h2 className="text-lg font-semibold text-black">
                  Nueva Oferta Laboral
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(etiquetasCampos).map(([campo, etiqueta]) => (
                    <div key={campo} className="col-span-1">
                      <label className="text-sm font-medium text-black">
                        {etiqueta}
                      </label>
                      <input
                        type={
                          campo === "fecha_cierre"
                            ? "date"
                            : campo.includes("salary")
                            ? "number"
                            : "text"
                        }
                        placeholder={etiqueta}
                        value={formOferta[campo] || ""}
                        onChange={(e) =>
                          setFormOferta({
                            ...formOferta,
                            [campo]: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded text-black"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => {
                    setModalOfertaOpen(false);
                    setMensajeAnalista("");
                    }}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={crearOfertaLaboral}
                    className="px-4 py-2 text-white rounded bg-indigo-600"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalAnalistaOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4">
          {mensajeAnalista && (
            <div className="text-sm text-indigo-700 bg-indigo-100 p-2 rounded">
              {mensajeAnalista}
            </div>
          )}
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

{modalVerOfertasOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-2xl w-3/4 max-h-[80vh] overflow-auto text-black">

  {mensajeAsignacion && (
      <div className="mb-4 text-sm text-indigo-700 bg-indigo-100 p-2 rounded">
        {mensajeAsignacion}
      </div>
  )}  

  

      <h2 className="text-2xl font-semibold mb-4">Mis Ofertas</h2>
      {ofertas.length === 0 ? (
        <p>No hay ofertas disponibles.</p>
      ) : (
        <table className="min-w-full table-auto border-collapse text-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Descripción</th>
              <th className="px-4 py-2 text-left">Asignar Analista</th>
            </tr>
          </thead>
          <tbody>
            {ofertas.map(o => (
              <tr key={o.id_oferta} className="border-t">
                <td className="px-4 py-2">{o.nombre}</td>
                <td className="px-4 py-2">{o.descripcion}</td>
                <td className="px-4 py-2 flex items-center">
                  <select
                    value={selectedAnalistas[o.id_oferta] || ""}
                    onChange={e => handleSelectAnalista(o.id_oferta, e.target.value)}
                    className="border px-2 py-1 rounded mr-2 text-black"
                  >
                    <option value="">Seleccione analista</option>
                    {analistas.map(a => (
                      <option key={a.id} value={a.id}>{a.username}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => asignarAnalista(o.id_oferta)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Asignar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-6 text-right">
        <button
          onClick={() => {
          setModalVerOfertasOpen(false);
          setMensajeAsignacion("");
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
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
              return (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{licencia.tipo}</td>
                  <td className="px-4 py-2">{licencia.descripcion}</td>
                  <td className="px-4 py-2">{licencia.fecha_inicio || "-"}</td>
                  <td className="px-4 py-2">{licencia.estado}</td>
                  <td className="px-4 py-2">
                    {licencia.certificado_url ? (
                      <a
                        href={licencia.certificado_url}
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
                    {licencia.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => evaluarLicencia(licencia.id_licencia, "aprobada")}
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => evaluarLicencia(licencia.id_licencia, "rechazada")}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {licencia.estado === "aprobada" && licencia.certificado_url && (
                      <button
                        onClick={() => evaluarLicencia(licencia.id_licencia, "activa")}
                        className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                      >
                        Activar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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




        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}