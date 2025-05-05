import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { UserPlus, Users, Settings, Edit } from "lucide-react";
import isLightColor from "../components/isLightColor";
import GestionUsuarios from "../components/GestionUsuarios";
import PreferenciasEmpresa from "../components/PreferenciasEmpresa";

export default function AdminEmpHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [modalPreferencias, setModalPreferencias] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({ nombre: "", apellido: "", username: "", email: "" });
  const navigate = useNavigate(); 

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/info-admin`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Error al autenticar");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => console.error("❌ Error al obtener usuario:", err))
      .finally(() => setLoadingUser(false));
  }, []);

  const empresaId = user?.id_empresa;
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

  const crearManager = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrar-manager`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.nombre,
          lastname: formData.apellido,
          username: formData.username,
          email: formData.email
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje(
          `Usuario creado correctamente.\n\nUser: ${data.credentials.username}\nCredencial temporal: ${data.credentials.password}`
        );
        setFormData({ nombre: "", apellido: "", username: "", email: "" });
      } else {
        setMensaje(`Error: ${data.error}`);
      }
    } catch (err) {
      setMensaje("Error al conectar con el servidor");
    }
  };

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
              />
              <button
                onClick={() => alert("Editar perfil próximamente")}
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
              <h2 className="text-lg font-semibold" style={{ color: estilosSafe.color_texto }}>Acciones disponibles: Administrador de Empresa</h2>
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

        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}
