import { useEffect, useState } from "react";

export function useGestionUsuarios({ service }) {
  const [empleados, setEmpleados] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  useEffect(() => {
    service
      .obtenerEmpleados()
      .then(setEmpleados)
      .catch((err) => console.error("❌ Error al obtener empleados:", err));
  }, [service]);

  const desvincular = async (id) => {
    service
      .desvincularEmpleado({ idEmpleado: id })
      .then(() => {
        setEmpleados(empleados.filter((e) => e.id !== id));
        setConfirmModal({ open: false, id: null });
      })
      .catch(() => console.error("❌ Error al desvincular empleado"));
  };

  return { empleados, desvincular, confirmModal, setConfirmModal };
}
