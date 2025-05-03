import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { UserPlus, Users, Settings, Edit } from "lucide-react";

export default function AdminEmpHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate(); 

  // carga user
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

  // obtengo id de empresa con user
  const empresaId = user?.id_empresa;
  const { estilos, loading: loadingEstilos } = useEmpresaEstilos(empresaId);

  // Manejo de estados de carga
  if (loadingUser) {
    return <div className="p-10 text-center">Cargando usuario…</div>;
  }
  if (!user) {
    return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;
  }
  if (loadingEstilos) {
    return <div className="p-10 text-center">Cargando preferencias de empresa…</div>;
  }

  // valores por defectos si no hay estilos de empresa
  const estilosSafe = {
    color_principal: estilos?.color_principal ?? "#2563eb",
    color_secundario: estilos?.color_secundario ?? "#f3f4f6",
    color_texto: estilos?.color_texto ?? "#000000",
    slogan: estilos?.slogan ?? "Bienvenido",
    logo_url: estilos?.logo_url ?? null,    
  };

  // acciones admin-emp
  const acciones = [
    {
      icon: UserPlus,
      titulo: "Crear Managers",
      descripcion: "Designá managers para gestionar ofertas y equipos.",
      onClick: () => {/* abrir modal de registro de manager */},
    },
    {
      icon: Users,
      titulo: "Gestionar Usuarios",
      descripcion: "Visualizá y administrá los usuarios de tu empresa.",
      onClick: () => alert("Funcionalidad en desarrollo"),
    },
    {
      icon: Settings,
      titulo: "Configurar Empresa",
      descripcion: "Ajustes de estilo y datos empresariales.",
      onClick: () => alert("Funcionalidad en desarrollo"),
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

  return (
    <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe, loading: loadingEstilos }}>
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
              <button
                onClick={() => setEditProfile(true)}
                className="absolute top-2 right-2 p-1 border rounded-full hover:bg-gray-100"
                style={{ backgroundColor: estilosSafe.color_secundario }}
              >
                <Edit size={16} />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="md:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold">Acciones disponibles</h2>
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
                    <h3 className="text-base font-semibold" style={{ color: estilosSafe.color_texto }}>{titulo}</h3>
                    <p className="text-sm mt-1" style={{ color: estilosSafe.color_texto }}>{descripcion}</p>
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
