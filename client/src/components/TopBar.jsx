import { Bell, Edit, LogOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiTelegram } from "react-icons/si";
import { Link, useNavigate } from "react-router-dom";
import isLightColor from "../components/isLightColor";
import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";


export function TopBar({ username, user, onEditPerfil, onPostulacion, showBell = true }) {
  const { estilos } = useEstiloEmpresa();
  const primary = estilos?.color_principal ?? "#2563eb";
  const logoUrl = estilos?.logo_url ?? null;
  const textColor = estilos?.color_texto ?? (isLightColor(primary) ? "#000000" : "#ffffff");
  const API_URL = import.meta.env.VITE_API_URL;

  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const notificacionesRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

const [telegramLink, setTelegramLink] = useState(null);
const [mostrarBotonTelegram, setMostrarBotonTelegram] = useState(false);

  const rol = localStorage.getItem("rol") || "reclutador";
  const endpointBase = {
    candidato: "candidato",
    manager: "manager",
    "admin-emp": "admin-emp",
    reclutador: "reclutador",
    empleado: "empleado"
  }[rol] || "reclutadores";

  // Imagen de perfil
  const imgSrc = useMemo(() => {
    if (!user?.fotoUrl) return "https://i.pravatar.cc/150?img=12";
    const cleanPath = user.fotoUrl.replace(/^\/+/, "");
    return cleanPath.startsWith("http") ? cleanPath : `${API_URL}/${cleanPath}`;
  }, [user?.fotoUrl]);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const res1 = await fetch(`${import.meta.env.VITE_API_URL}/api/notificaciones-${endpointBase}-no-leidas`, { credentials: "include" });
        const res2 = await fetch(`${import.meta.env.VITE_API_URL}/api/notificaciones-${endpointBase}-no-leidas-contador`, { credentials: "include" });
        if (res1.ok) setNotificaciones((await res1.json()).notificaciones);
        if (res2.ok) setUnreadCount((await res2.json()).total_no_leidas);
      } catch (e) {
        console.error("Error al traer notificaciones", e);
      }
    };

    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 2000);
    return () => clearInterval(interval);
  }, [endpointBase]);

  // Cierra modales al hacer clic fuera
  useEffect(() => {
    const clickOutside = (e) => {
      if (notificacionesRef.current && !notificacionesRef.current.contains(e.target)) {
        setModalVisible(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileVisible(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cerrar sesión");
        navigate("/");
      })
      .catch((err) => console.error("Error al cerrar sesión:", err));
  };

  // Subir CV desde la card
  const handleUploadCVFromTopBar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/upload-cv`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent("cvSubidoOk", { detail: "¡CV subido exitosamente!" }));
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al subir CV:", error);
      alert("Error de conexión al subir CV");
    }
  };


useEffect(() => {
  const obtenerLinkTelegram = async () => {
    try {
      const res = await fetch(`${API_URL}/api/telegram/link`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTelegramLink(data.link);
      }
    } catch (error) {
      console.error("Error al obtener el link de Telegram:", error);
    }
  };

  // Mostrar solo si el rol es válido
  const rolesPermitidos = ["manager", "reclutador", "empleado"];
  if (rolesPermitidos.includes(rol)) {
    setMostrarBotonTelegram(true);
    obtenerLinkTelegram();
  }
}, [rol]);


  return (
    <header
      className="sticky top-0 flex justify-between items-center py-4 px-6 border-b z-50"
      style={{ borderColor: primary, color: textColor, backgroundColor : estilos?.color_secundario  }}
    >
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo empresa"
            className="h-23 w-auto "
          />
        ) : (
          <h1 className="text-2xl font-bold" style={{ color: textColor }}>
            SIGRH+
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4 relative">
        {/* campana */}
        {showBell && (
          <button
            onClick={() => {
              setModalVisible((prev) => !prev);
              if (!modalVisible) setProfileVisible(false);
            }}
            className="relative p-2 rounded-full"
            style={{ backgroundColor: primary, color: textColor }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* modal de notificaciones */}
        {showBell && modalVisible && (
          <div
            ref={notificacionesRef}
            className="absolute right-0 top-12 w-80 bg-white border shadow-lg rounded-lg z-50 text-black max-h-[500px] overflow-y-auto"
          >
            {notificaciones.length > 0 ? (
              <>
                <ul>
                  {notificaciones.map((n) => (
                    <li
                      key={n.id}
                      className={`p-2 text-sm cursor-pointer ${n.leida ? "text-gray-400" : "hover:bg-gray-100"}`}
                      onClick={async () => {
                        if (n.leida) return;
                        try {
                          await fetch(`${import.meta.env.VITE_API_URL}/api/leer-notificacion-${endpointBase}/${n.id}`, {
                            method: "PUT",
                            credentials: "include"
                          });
                          setNotificaciones((prev) =>
                            prev.map((notif) =>
                              notif.id === n.id ? { ...notif, leida: true } : notif
                            )
                          );
                          setUnreadCount((prev) => Math.max(prev - 1, 0));
                        } catch (error) {
                          console.error("Error al marcar como leída:", error);
                        }
                      }}
                    >
                      {n.mensaje}
                    </li>
                  ))}
                </ul>
                <button
                  className="w-full text-xs text-blue-600 hover:underline p-2 text-left"
                  onClick={async () => {
                    try {
                      await Promise.all(notificaciones.map((n) =>
                        fetch(`${import.meta.env.VITE_API_URL}/api/leer-notificacion-${endpointBase}/${n.id}`, {
                          method: "PUT",
                          credentials: "include"
                        })
                      ));
                      setNotificaciones([]);
                      setUnreadCount(0);
                    } catch (e) {
                      console.error("Error al marcar todas como leídas:", e);
                    }
                  }}
                >
                  Marcar todas como leídas
                </button>
              </>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">No tienes notificaciones</div>
            )}
            <footer className="flex justify-center">
              <Link style={{ color: primary }} to="/notificaciones" className="underline text-xs p-2">Ver todas las notificaciones</Link>
            </footer>
          </div>
        )}

        {/* icono de usuario */}
          <img
            src={imgSrc}
            alt="foto perfil"
            className="w-10 h-10 rounded-full border-2 cursor-pointer"
            style={{ borderColor: primary }}
            onClick={() => {
              setProfileVisible((prev) => !prev);
              if (!profileVisible) setModalVisible(false);
            }}
          />

        {/* dropdown de perfil */}
{profileVisible && (
  <div
    ref={profileRef}
    className="absolute right-0 top-12 w-72 bg-white border shadow-lg rounded-xl z-50 p-4 flex flex-col gap-3 items-center"
    style={{
      borderColor: primary,
      backgroundColor: estilos && estilos.color_secundario ? estilos.color_secundario : "#fff",
      color: textColor,
    }}
  >
    <img
      src={imgSrc}
      className="w-20 h-20 rounded-full border shadow"
      style={{ borderColor: primary }}
    />
    <div className="text-center">
      <p className="font-bold text-lg">{user?.nombre} {user?.apellido}</p>
      <p className="text-sm text-gray-500">{user?.correo}</p>
      <p className="text-xs text-gray-400 italic">{rol}</p>
    </div>

    <div className="w-full flex flex-col gap-2 mt-2">
      <button
        onClick={onEditPerfil}
        className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg cursor-pointer"
        style={{
          backgroundColor: primary,
          color: isLightColor(primary) ? "#000" : "#fff",
        }}
      >
        <Edit size={16} /> Editar perfil
      </button>

      {mostrarBotonTelegram && telegramLink && (
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg cursor-pointer"
          style={{
            backgroundColor: "#229ED9",
            color: "#fff",
          }}
        >
          <SiTelegram size={16} /> Activar notificaciones Telegram
        </a>
      )}

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-600 text-white shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg cursor-pointer"
      >
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  </div>
)}


      </div>
    </header>
  );
}