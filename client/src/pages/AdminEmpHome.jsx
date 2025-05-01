import { useState } from "react";
import { motion } from "framer-motion";
import Cropper from "react-easy-crop";
import { Building, UserPlus, Settings, Users, Edit } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import PageLayout from "../components/PageLayout";

export default function AdminEmpHome() {
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
      className={`min-h-screen bg-white ${editProfile ? "backdrop-blur-sm" : ""}`}
    >
      <PageLayout>
        <TopBar username={`${user.nombre} ${user.apellido}`} onLogout={() => alert("Logout")} />

        <div className="px-4 py-6">
          <div className="mx-auto w-fit bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full border border-blue-200 shadow-sm">
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
                  className="cursor-pointer border border-blue-100 hover:border-blue-300 p-5 rounded-xl shadow-sm transition hover:shadow-md bg-white"
                >
                  <Icon className="w-6 h-6 text-blue-500 mb-2" />
                  <h3 className="text-base font-semibold text-gray-800">{titulo}</h3>
                  <p className="text-sm text-gray-500 mt-1">{descripcion}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {editProfile && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Editar perfil</h2>
              <input
                type="text"
                value={editedNombre}
                onChange={(e) => setEditedNombre(e.target.value)}
                placeholder="Nombre completo"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={editedCorreo}
                onChange={(e) => setEditedCorreo(e.target.value)}
                placeholder="Correo"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full p-2 text-sm text-gray-500"
              />
              {photoFile && (
                <div className="relative w-48 h-48 mx-auto mt-4">
                  <Cropper
                    image={photoFile}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                  />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full mt-4"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditProfile(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Cancelar
                </button>
                <button onClick={() => setEditProfile(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow">
                  Guardar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Crear nuevo Manager</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Credencial"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => alert("Creación simulada")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </motion.div>
  );
}
