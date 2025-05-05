import { motion } from "framer-motion";
import { BarChart2, FilePlus, FileText, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { ProfileCard } from "../components/ProfileCard";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";

export default function AnalistaHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  // Carga del usuario autenticado
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Error al autenticar");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => console.error("❌ Error al obtener usuario:", err))
      .finally(() => setLoadingUser(false));
  }, []);

  // Obtener estilos del sistema, si es necesario
  const estilosSafe = {
    color_principal: "#2563eb",
    color_secundario: "#f3f4f6",
    color_texto: "#000000",
    slogan: "Bienvenido al panel de administración de Analista",
  };

  // Acciones disponibles para el analista
  const acciones = [
    {
      icon: Users,
      titulo: "Ver Listado de Ofertas Asignadas",
      descripcion: "Accede al listado de ofertas disponibles en el sistema.",
      href: "/analista/ofertas"
    },
    {
      icon: FilePlus,
      titulo: "Cargar Licencias",
      descripcion: "Carga nuevas licencias o visualiza las existentes.",
      href: "/analista/licencias"
    },
    {
      icon: BarChart2,
      titulo: "Visualizar Indicadores de Desempeño",
      descripcion: "Revisa los indicadores clave de desempeño de los empleados.",
      href: "/analista/indicadores-desempeño"
    },
    {
      icon: FileText,
      titulo: "Visualizar Reportes",
      descripcion: "Revisa los KPIs del sistema.",
      href: "/analista/reportes"
    },
  ];

  // Función de logout
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

  if (loadingUser) {
    return <div className="p-10 text-center">Cargando usuario…</div>;
  }

  if (!user) {
    return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;
  }

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
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="md:col-span-2 space-y-4"
            >
              <h2 className="text-lg font-semibold">Acciones disponibles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {acciones.map(({ icon: Icon, titulo, descripcion, href }, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="cursor-pointer border p-5 rounded-xl shadow-sm hover:shadow-md"
                    style={{
                      backgroundColor: estilosSafe.color_secundario,
                      borderColor: estilosSafe.color_secundario,
                      color: estilosSafe.color_texto,
                    }}
                  >
                    <Link to={href}>
                      <Icon className="w-6 h-6 mb-2" style={{ color: estilosSafe.color_texto }} />
                      <h3 className="text-base font-semibold">{titulo}</h3>
                      <p className="text-sm mt-1">{descripcion}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}
