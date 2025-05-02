import { useState } from "react";
import { motion } from "framer-motion";
import Cropper from "react-easy-crop";
import { Building, UserPlus, Settings, Users, Edit } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import PageLayout from "../components/PageLayout";
import { useTheme } from "../components/ThemeContext";

export default function AdminEmpHome() {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [editedNombre, setEditedNombre] = useState("Admin Empresa");
  const [editedCorreo, setEditedCorreo] = useState("admin@empresa.com");
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const user = {
    nombre: "Admin",
    apellido: "Empresa",
    correo: "admin@empresa.com",
    fotoUrl: "https://i.pravatar.cc/150?img=11"
  };

  const acciones = [
    {
      icon: UserPlus,
      titulo: "Crear Managers",
      descripcion: "Designá managers para gestionar ofertas y equipos.",
      onClick: () => setShowModal(true),
    },
    {
      icon: Users,
      titulo: "Gestionar Usuarios",
      descripcion: "Visualizá y administrá los usuarios de tu empresa.",
      onClick: () => alert("Funcionalidad no implementada aún"),
    },
    {
      icon: Settings,
      titulo: "Configurar empresa",
      descripcion: "Ajustes de estilo y datos empresariales.",
      onClick: () => alert("Funcionalidad no implementada aún"),
    },
  ];

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(URL.createObjectURL(file));
      setPreviewPhoto(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ backgroundColor: theme.color_sec }}
      className={`min-h-screen ${editProfile ? "backdrop-blur-sm" : ""}`}
    >
      <PageLayout>
        <TopBar username={`${user.nombre} ${user.apellido}`} onLogout={() => alert("Logout")} />

        <div className="px-4 py-6">
          <div
            className="mx-auto w-fit text-sm font-medium px-4 py-2 rounded-full border shadow-sm"
            style={{
              backgroundColor: theme.color_sec,
              color: theme.color_princ,
              borderColor: theme.color_princ
            }}
          >
            Gestión empresarial avanzada
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative"
          >
            <ProfileCard
              nombre={editedNombre}
              correo={editedCorreo}
              fotoUrl={photoFile || user.fotoUrl}
              showCvLink={false}
              size="xl"
            />
            <button
              onClick={() => setEditProfile(true)}
              className="absolute top-2 right-2 p-1 bg-white border border-gray-300 rounded-full hover:bg-gray-100"
            >
              <Edit size={16} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="md:col-span-2 space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-800">Acciones disponibles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {acciones.map(({ icon: Icon, titulo, descripcion, onClick }, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.4, ease: "easeOut" }}
                  onClick={onClick}
                  className="cursor-pointer border p-5 rounded-xl shadow-sm transition hover:shadow-md bg-white"
                  style={{
                    borderColor: theme.color_princ
                  }}
                >
                  <Icon className="w-6 h-6 mb-2" style={{ color: theme.color_princ }} />
                  <h3 className="text-base font-semibold text-gray-800">{titulo}</h3>
                  <p className="text-sm text-gray-500 mt-1">{descripcion}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* El resto del código del modal y edición de perfil no necesita cambios de theme */}

      </PageLayout>
    </motion.div>
  );
}
