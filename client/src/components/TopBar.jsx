import React, { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";
import isLightColor from "../components/isLightColor";

export function TopBar({ username, onLogout, children }) {
  const { estilos } = useEstiloEmpresa();
  const primary = estilos?.color_principal ?? "#2563eb";
  const logoUrl = estilos?.logo_url ?? null;
  const textColor = estilos?.color_texto ?? (isLightColor(primary) ? "#000000" : "#ffffff");

  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const notificacionesRef = useRef(null);

  const rol = localStorage.getItem("rol") || "reclutador";
  const endpointBase = {
    candidato: "candidato",
    manager: "manager",
    "admin-emp": "admin-emp",
    reclutador: "reclutador",
    empleado: "empleado"
  }[rol] || "reclutadores";

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

  useEffect(() => {
    const clickOutside = (e) => {
      if (notificacionesRef.current && !notificacionesRef.current.contains(e.target)) {
        setModalVisible(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <header
      className="flex justify-between items-center py-1 px-6 border-b"
      style={{ borderColor: primary, color: textColor }}
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
        {children}
      </div>

      <div className="flex items-center gap-4 relative">
        {/* campana */}
        <button
          onClick={() => setModalVisible((prev) => !prev)}
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

        {/* notificaciones */}
        {modalVisible && (
          <div
            ref={notificacionesRef}
            className="absolute top-full left-0 mt-2 w-80 bg-white border shadow-lg rounded-lg z-50 text-black"
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
          </div>
        )}

        {/* Bienvenida y logout */}
        <span className="font-medium">Bienvenido, {username}</span>
        <button
          onClick={onLogout}
          className="px-3 py-1 rounded"
          style={{ backgroundColor: primary, color: textColor }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
