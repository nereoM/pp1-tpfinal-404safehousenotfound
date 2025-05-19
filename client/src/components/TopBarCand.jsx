import React, { useState, useEffect, useRef } from "react";
import { useEstiloEmpresa } from "../context/EstiloEmpresaContext";
import isLightColor from "../components/isLightColor";
import { Bell } from "lucide-react";

export function TopBar({ username, onLogout, onNotificaciones, children }) {
  const blue = "#3b82f6";
  const textColor = "#ffffff";
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [rolValido, setRolValido] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/info-candidato`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setRolValido(true);
        }
      } catch (error) {
        console.error("Error al verificar el rol:", error);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    if (rolValido) {
      const fetchNotificaciones = async () => {
        try {
          const responseContador = await fetch(`${import.meta.env.VITE_API_URL}/api/notificaciones-candidato-no-leidas-contador`, {
            method: "GET",
            credentials: "include",
          });

          if (responseContador.ok) {
            const dataContador = await responseContador.json();
            setUnreadCount(dataContador.total_no_leidas);
          }

          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notificaciones-candidato-no-leidas`, {
            method: "GET",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            setNotificaciones(data.notificaciones);
          }
        } catch (error) {
          console.error("Error al traer notificaciones:", error);
        }
      };

      fetchNotificaciones();
    }
  }, [rolValido]);

  const handleNotificacionClick = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/leer-notificacion-candidato/${id}`, {
        method: "PUT",
        credentials: "include",
      });
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setModalVisible(false);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalVisible]);

  return (
    <header
      className="flex justify-between items-center py-4 px-6 border-b"
      style={{ borderColor: blue, backgroundColor: "#ffffff", color: blue }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold px-3 py-1 rounded" style={{ color: blue }}>
          SIGRH+
        </h1>
        {children}
      </div>

      <div className="flex items-center gap-4 relative">
        <button
          onClick={() => setModalVisible(!modalVisible)}
          className="relative p-2 rounded-full"
          style={{ backgroundColor: blue, color: textColor }}
          disabled={!rolValido}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <span className="font-medium" style={{ color: blue }}>
          Bienvenido, {username}
        </span>
        <button
          onClick={onLogout}
          className="px-3 py-1 rounded"
          style={{ backgroundColor: blue, color: textColor }}
        >
          Cerrar sesión
        </button>

        {modalVisible && (
<div
  ref={modalRef}
  className="absolute right-0 mt-2 w-80 bg-white border shadow-lg rounded-lg z-50"
  style={{ transform: "translateX(-60%)", top: "48px" }}
>
  {notificaciones.length > 0 ? (
    <ul>
      {notificaciones.map((notificacion) => (
        <li
          key={notificacion.id}
          className={`p-2 cursor-pointer ${notificacion.leida ? "bg-gray-200" : "bg-white"}`}
          onClick={() => handleNotificacionClick(notificacion.id)}
        >
          {notificacion.mensaje}
        </li>
      ))}
    </ul>
  ) : (
    <div className="p-4 text-center text-gray-500">No tienes notificaciones</div>
  )}
</div>
        )}
      </div>
    </header>
  );
}
