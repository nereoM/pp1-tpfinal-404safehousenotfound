import {
  ArrowUpRight,
  Bell,
  ClipboardList,
  CreditCard,
  Edit,
  File,
  FileText,
  LogOut
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./shadcn/Dialog";

export function TopBar({
  username,
  onLogout,
  onEditPerfil,
  user,
  onPostulacion,
  cvs,
}) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { estilos } = useEstiloEmpresa();
  const blue = estilos?.color_principal || "#3b82f6";
  const textColor = "#ffffff";

  const perfilRef = useRef(null);
  const notificacionesRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [perfilVisible, setPerfilVisible] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVerCvs, setModalVerCvs] = useState(false);

  const imgSrc = useMemo(() => {
    if (!user?.fotoUrl) return "https://i.pravatar.cc/150?img=12";
    const cleanPath = user.fotoUrl.replace(/^\/+/, "");
    return cleanPath.startsWith("http") ? cleanPath : `${API_URL}/${cleanPath}`;
  }, [user?.fotoUrl]);

  const fetchNotificaciones = async () => {
    try {
      const res1 = await fetch(
        `${API_URL}/api/notificaciones-candidato-no-leidas`,
        { credentials: "include" }
      );
      const res2 = await fetch(
        `${API_URL}/api/notificaciones-candidato-no-leidas-contador`,
        { credentials: "include" }
      );
      if (res1.ok) setNotificaciones((await res1.json()).notificaciones);
      if (res2.ok) setUnreadCount((await res2.json()).total_no_leidas);
    } catch (e) {
      console.error("Error al traer notificaciones", e);
    }
  };
  useEffect(() => {
    fetchNotificaciones();

    const handler = () => fetchNotificaciones();
    window.addEventListener("notificacionActualizada", handler);

    const interval = setInterval(() => {
      fetchNotificaciones();
    }, 1000);

    return () => {
      window.removeEventListener("notificacionActualizada", handler);
      clearInterval(interval);
    };
  }, []);

  // cierra modales al hacer clic fuera
  useEffect(() => {
    const clickOutside = (e) => {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) {
        setPerfilVisible(false);
      }
      if (
        notificacionesRef.current &&
        !notificacionesRef.current.contains(e.target)
      ) {
        setModalVisible(false);
        setNotificaciones((prev) => prev.filter((n) => !n.leida));
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const handleUploadCVFromTopBar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/upload-cv`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        const successToastEvent = new CustomEvent("cvSubidoOk", {
          detail: "¡CV subido exitosamente!",
        });
        window.dispatchEvent(successToastEvent);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al subir CV:", error);
      alert("Error de conexión al subir CV");
    }
  };

  return (
    <header className="sticky top-0 z-[50] bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold" style={{ color: blue }}>
          SIGRH+
        </h1>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* notificaciones */}
        <button
          onClick={() => {
            setModalVisible((prev) => !prev);
            if (!modalVisible) setPerfilVisible(false);
          }}
          className="relative p-2 rounded-full"
          style={{ backgroundColor: blue, color: textColor }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* icono de usuario */}
        <img
          src={imgSrc}
          alt="foto perfil"
          className="w-10 h-10 rounded-full border-2 border-blue-600 cursor-pointer"
          onClick={() => {
            setPerfilVisible((prev) => !prev);
            if (!perfilVisible) setModalVisible(false);
          }}
        />

        {/* dropdown de perfil */}
        {perfilVisible && (
          <div
            ref={perfilRef}
            className="absolute right-0 top-16 w-72 bg-white border shadow-lg rounded-lg z-50 p-4"
          >
            <div className="text-center">
              <img
                src={imgSrc}
                className="w-16 h-16 rounded-full mx-auto border border-blue-500"
              />
              <p className="font-semibold mt-2">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-sm text-gray-500">{user?.correo}</p>
            </div>

            <div className="mt-4 space-y-2">
              {user?.cvUrl && (
                <a
                  href={`${API_URL}/${user.cvUrl.replace(/^\//, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <FileText size={16} /> Ver CV subido
                </a>
              )}

              <label
                htmlFor="cv-upload"
                className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer w-full"
              >
                <FileText size={16} /> Subir nuevo CV
              </label>
              <input
                id="cv-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleUploadCVFromTopBar(file);
                }}
              />

              <button
                onClick={onEditPerfil}
                className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 w-full"
              >
                <Edit size={16} /> Editar perfil
              </button>

              <button
                onClick={onPostulacion}
                className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 w-full"
              >
                <ClipboardList size={16} /> Ver postulaciones
              </button>

              <button
                onClick={() => (window.location.href = "/pagos")}
                className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 w-full"
              >
                <CreditCard size={16} /> Suscribirse (empresa)
              </button>

              <button
                onClick={() => setModalVerCvs(true)}
                className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 w-full"
              >
                <File size={16} /> Ver CV's
              </button>

              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 w-full"
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* modal de notificaciones */}
        {modalVisible && (
          <div
            ref={notificacionesRef}
            className="absolute right-0 top-16 w-80 bg-white border shadow-lg rounded-lg z-50 max-h-[500px] overflow-y-auto"
          >
            {notificaciones.length > 0 ? (
              <ul>
                {notificaciones.map((n) => (
                  <li
                    key={n.id}
                    className={`p-2 text-sm cursor-pointer ${
                      n.leida ? "text-gray-400" : "hover:bg-gray-100"
                    }`}
                    onClick={async () => {
                      if (n.leida) return;

                      try {
                        await fetch(
                          `${API_URL}/api/leer-notificacion-candidato/${n.id}`,
                          {
                            method: "PUT",
                            credentials: "include",
                          }
                        );

                        setNotificaciones((prev) =>
                          prev.map((notif) =>
                            notif.id === n.id
                              ? { ...notif, leida: true }
                              : notif
                          )
                        );

                        setUnreadCount((prev) => Math.max(prev - 1, 0));
                      } catch (error) {
                        console.error(
                          "Error al marcar notificación como leída:",
                          error
                        );
                      }
                    }}
                  >
                    {n.mensaje}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No tienes notificaciones
              </div>
            )}
          </div>
        )}

        <Dialog open={modalVerCvs} onOpenChange={setModalVerCvs}>
          <DialogContent className="text-black">
            <DialogHeader>
              <DialogTitle>Tus CV's</DialogTitle>
            </DialogHeader>
            <ul className="flex flex-col gap-2">
              {cvs?.map((cv) => (
                <div
                  key={cv.id}
                  className={`flex border-gray-300 items-center p-3 border rounded-lg cursor-pointer transition w-full`}
                >
                  <div className="w-10 h-12 bg-red-500 text-white font-bold flex items-center justify-center rounded-sm text-sm mr-4 shadow">
                    PDF
                  </div>
                  <div className="flex justify-between w-full items-center">
                    <div className="flex-grow">
                      <p className="text-sm font-medium leading-tight">
                        {" "}
                        {cv.url
                          .split("/")
                          .pop()
                          .split("_")
                          .slice(0, -1)
                          .join("_")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(cv.fecha_subida).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      className="text-indigo-500 group flex gap-1"
                      target="_blank"
                      href={`${import.meta.env.VITE_API_URL}/${cv.url}`}
                    >
                      Abrir<ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition"/>
                    </a>
                  </div>
                </div>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
