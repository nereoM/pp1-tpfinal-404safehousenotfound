import { motion } from "framer-motion";
import { BarChart2, FilePlus, FileText, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { ProfileCard } from "../components/ProfileCard";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";

export default function ReclutadorHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const [ofertasAsignadas, setOfertasAsignadas] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [mensajeOfertas, setMensajeOfertas] = useState("");
  const [modalOfertasOpen, setModalOfertasOpen] = useState(false);  

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reclutador-home`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Error al autenticar");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => console.error("❌ Error al obtener usuario:", err))
      .finally(() => setLoadingUser(false));
  }, []);

  const estilosSafe = {
    color_principal: "#2563eb",
    color_secundario: "#f3f4f6",
    color_texto: "#000000",
    slogan: "Bienvenido al panel de administración de Reclutador",
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

  const openModalOfertas = () => {
    setMensajeOfertas("");
    fetchOfertasAsignadas();
    setModalOfertasOpen(true);
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
    },
    {
      icon: FilePlus,
      titulo: "Gestionar Licencias",
      descripcion: "Visualizá y administrá tus licencias cargadas.",
    },
    {
      icon: BarChart2,
      titulo: "Ver Empleados",
      descripcion: "Visualizá y administrá los empleados de tu empresa.",
    },
    {
      icon: BarChart2,
      titulo: "Visualizar Indicadores de Desempeño",
      descripcion: "Revisa los indicadores clave de desempeño de los empleados.",
    },
    {
      icon: FileText,
      titulo: "Visualizar Reportes",
      descripcion: "Revisa los KPIs del sistema.",
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
                <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
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
                        Ubicación: {oferta.location} | Modalidad: {oferta.workplace_type}
                      </p>
                      <p className="text-xs text-gray-600">
                        Publicación: {oferta.fecha_publicacion?.split("T")[0]} | Cierre: {oferta.fecha_cierre?.split("T")[0]}
                      </p>
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
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}
