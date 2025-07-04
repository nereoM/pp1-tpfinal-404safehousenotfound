import { AnimatePresence, motion } from "framer-motion";
import { Download, FileX2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useLicenciasACargo } from "../services/useLicenciasACargo";
import MensajeAlerta from "./MensajeAlerta";
import { Dialog, DialogContent, DialogTitle } from "./shadcn/Dialog";

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

export function LicenciasACargoModal({
  service,
  extraContent,
  open,
  onOpenChange,
  showToast, // Nuevo prop para feedback visual
}) {
  const {
    error,
    licencias,
    loading,
    evaluarLicencia,
    mensajeEvaluacion,
    setError,
    licenciaSeleccionada,
    setLicenciaSeleccionada,
    sugerirFechas,
    motivoRechazo,
    setMotivoRechazo,
  } = useLicenciasACargo({ service });

  const [modalRechazoOpen, setModalRechazoOpen] = useState(false);
  const [modalNegociacionFecha, setModalNegociacionFecha] = useState(false);
  const [descripcionExpandida, setDescripcionExpandida] = useState(null);
  const [motivoExpandido, setMotivoExpandido] = useState(null);
  const [modalInvalidacionOpen, setModalInvalidacionOpen] = useState(false);

  // Filtros
  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroDescripcion, setFiltroDescripcion] = useState("");

  // Estado para licencias seleccionadas
  const [licenciasSeleccionadas, setLicenciasSeleccionadas] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    }
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Filtrado de licencias
  const licenciasFiltradas = licencias.filter((item) => {
    if (item.licencia.estado === "cancelada") return false;

    const licencia = item.licencia;
    const empleado = licencia.empleado;
    const empleadoOk = filtroEmpleado
      ? `${empleado.nombre} ${empleado.apellido}`
          .toLowerCase()
          .includes(filtroEmpleado.toLowerCase())
      : true;
    const tipoOk = filtroTipo
      ? licencia.tipo?.toLowerCase().includes(filtroTipo.toLowerCase())
      : true;
    const estadoOk = filtroEstado
      ? licencia.estado?.toLowerCase() === filtroEstado.toLowerCase()
      : true;
    const descripcionOk = filtroDescripcion
      ? licencia.descripcion
          ?.toLowerCase()
          .includes(filtroDescripcion.toLowerCase())
      : true;
    return empleadoOk && tipoOk && estadoOk && descripcionOk;
  });

  const abrirModalRechazo = (licencia) => {
    setLicenciaSeleccionada(licencia);
    setModalRechazoOpen(true);
  };

  const handleUpdateFecha = (newDate) => {
    if (!newDate) return;
    setLicenciaSeleccionada((prev) => ({
      ...prev,
      fecha_fin: newDate.to,
      fecha_inicio: newDate.from,
    }));
  };

  if (loading && open) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white p-6 rounded-2xl w-4/5 max-h-[80vh] overflow-auto text-black">
          <div className="mb-4 text-center font-semibold">
            Cargando licencias...
          </div>
        </div>
      </div>
    );
  }

  // Descargar reportes con feedback toast
  const descargarReporteLicenciasFiltradas = async (formato = "excel") => {
    const ids = licenciasFiltradas
      .map((item) => item.licencia.id_licencia)
      .join(",");
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/reportes-licencias?formato=${formato}&ids=${ids}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("No se pudo descargar el reporte");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        formato === "pdf" ? "reporte_licencias.pdf" : "reporte_licencias.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast &&
        showToast("Reporte de licencias descargado correctamente.", "success");
    } catch (err) {
      showToast
        ? showToast("Error al descargar el reporte de licencias", "error")
        : alert("Error al descargar el reporte de licencias");
    }
  };

  const descargarReporteLicenciasSeleccionadas = async (formato = "excel") => {
    if (licenciasSeleccionadas.length === 0) {
      showToast
        ? showToast(
            "Selecciona al menos una licencia para descargar el reporte.",
            "error"
          )
        : alert("Selecciona al menos una licencia para descargar el reporte.");
      return;
    }
    const ids = licenciasSeleccionadas.join(",");
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/reportes-licencias?formato=${formato}&ids=${ids}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("No se pudo descargar el reporte");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        formato === "pdf" ? "reporte_licencias.pdf" : "reporte_licencias.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast &&
        showToast("Reporte de licencias descargado correctamente.", "success");
    } catch (err) {
      showToast
        ? showToast(
            "Error al descargar el reporte de licencias seleccionadas",
            "error"
          )
        : alert("Error al descargar el reporte de licencias seleccionadas");
    }
  };

  if (!licencias.length) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="text-black max-h-[90vh] overflow-auto">
          <DialogTitle>Gestión de licencias</DialogTitle>
          <div className="flex flex-col gap-2 items-center justify-center">
            <FileX2/>
            <p>No se registraron licencias a tu cargo</p>
            <p className="opacity-65 text-sm text-center">En esta pestaña podras gestionar las licencias que fueron solicitas por el personal</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-black max-w-none w-[95vw] max-h-[90vh] overflow-auto">
        <DialogTitle>Gestión de licencias</DialogTitle>
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-600">Empleado</label>
            <input
              type="text"
              value={filtroEmpleado}
              onChange={(e) => setFiltroEmpleado(e.target.value)}
              className="border px-2 py-1 rounded text-black"
              placeholder="Buscar por empleado"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border px-2 py-1 rounded text-black"
            >
              <option value="">Todos</option>
              <option value="vacaciones">Vacaciones</option>
              <option value="enfermedad">Enfermedad</option>
              <option value="accidente_laboral">Accidente laboral</option>
              <option value="nacimiento_hijo">Nacimiento de hijo/a</option>
              <option value="duelo">Duelo</option>
              <option value="estudios">Estudios</option>
              <option value="matrimonio">Matrimonio</option>
              <option value="mudanza">Mudanza</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border px-2 py-1 rounded text-black"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
              <option value="sugerencia">Sugerencia</option>
              <option value="activa">Activa</option>
              <option value="activa y verificada">Activa y Verificada</option>
              <option value="invalidada">Invalidada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Descripción</label>
            <input
              type="text"
              value={filtroDescripcion}
              onChange={(e) => setFiltroDescripcion(e.target.value)}
              className="border px-2 py-1 rounded text-black"
              placeholder="Buscar por descripción"
            />
          </div>
        </div>

        {/* Botón de descarga con dropdown */}
        <div className="mb-4 flex flex-col sm:flex-row justify-end gap-2 relative">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpenDropdown((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-900 transition font-semibold shadow"
              title="Descargar reportes"
              type="button"
              aria-haspopup="menu"
              aria-expanded={openDropdown}
            >
              <Download className="w-5 h-5" />
              Descargar reportes
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <AnimatePresence>
              {openDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50"
                >
                  <div className="py-2">
                    <div className="px-4 py-1 text-xs text-gray-500 font-semibold">
                      Filtradas
                    </div>
                    <button
                      onClick={() => {
                        setOpenDropdown(false);
                        descargarReporteLicenciasFiltradas("excel");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 text-blue-700"
                    >
                      <Download className="w-4 h-4" /> Descargar Excel
                    </button>
                    <button
                      onClick={() => {
                        setOpenDropdown(false);
                        descargarReporteLicenciasFiltradas("pdf");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 text-red-700"
                    >
                      <Download className="w-4 h-4" /> Descargar PDF
                    </button>
                    <div className="px-4 py-1 mt-2 text-xs text-gray-500 font-semibold border-t">
                      Seleccionadas (Ctrl+Click)
                    </div>
                    <button
                      onClick={() => {
                        setOpenDropdown(false);
                        descargarReporteLicenciasSeleccionadas("excel");
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 text-blue-700 ${
                        licenciasSeleccionadas.length === 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={licenciasSeleccionadas.length === 0}
                    >
                      <Download className="w-4 h-4" /> Descargar Excel
                    </button>
                    <button
                      onClick={() => {
                        setOpenDropdown(false);
                        descargarReporteLicenciasSeleccionadas("pdf");
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 text-red-700 ${
                        licenciasSeleccionadas.length === 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={licenciasSeleccionadas.length === 0}
                    >
                      <Download className="w-4 h-4" /> Descargar PDF
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {mensajeEvaluacion && (
          <div className="mb-4 text-center text-indigo-700 font-semibold bg-indigo-100 p-2 rounded">
            {mensajeEvaluacion}
          </div>
        )}

        {/* Tabla con selección múltiple por fila */}
        <table className="table-auto w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Empleado</th>
              <th className="px-4 py-2 border">Tipo</th>
              <th className="px-4 py-2 border">Descripción</th>
              <th className="px-4 py-2 border">Fecha Inicio</th>
              <th className="px-4 py-2 border">Fecha Fin</th>
              <th className="px-4 py-2 border">Estado</th>
              <th className="px-4 py-2 border">Motivo Rechazo</th>
              <th className="px-4 py-2 border">Certificado</th>
              <th className="px-4 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {licenciasFiltradas.map((item, index) => {
              const licencia = item.licencia;
              const empleado = licencia.empleado;
              const isSelected = licenciasSeleccionadas.includes(
                licencia.id_licencia
              );
              return (
                <tr
                  key={index}
                  tabIndex={0}
                  aria-selected={isSelected}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-100 ring-2 ring-blue-400"
                      : "hover:bg-blue-50"
                  }`}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      setLicenciasSeleccionadas((sel) =>
                        sel.includes(licencia.id_licencia)
                          ? sel.filter((id) => id !== licencia.id_licencia)
                          : [...sel, licencia.id_licencia]
                      );
                    } else if (
                      e.shiftKey &&
                      licenciasSeleccionadas.length > 0
                    ) {
                      const lastIndex = licenciasFiltradas.findIndex(
                        (item) =>
                          licenciasSeleccionadas[
                            licenciasSeleccionadas.length - 1
                          ] === item.licencia.id_licencia
                      );
                      const thisIndex = index;
                      const [start, end] = [lastIndex, thisIndex].sort(
                        (a, b) => a - b
                      );
                      const idsInRange = licenciasFiltradas
                        .slice(start, end + 1)
                        .map((item) => item.licencia.id_licencia);
                      setLicenciasSeleccionadas((sel) =>
                        Array.from(new Set([...sel, ...idsInRange]))
                      );
                    } else {
                      setLicenciasSeleccionadas((sel) =>
                        sel.length === 1 && sel[0] === licencia.id_licencia
                          ? []
                          : [licencia.id_licencia]
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      if (e.ctrlKey || e.metaKey) {
                        setLicenciasSeleccionadas((sel) =>
                          sel.includes(licencia.id_licencia)
                            ? sel.filter((id) => id !== licencia.id_licencia)
                            : [...sel, licencia.id_licencia]
                        );
                      } else {
                        setLicenciasSeleccionadas((sel) =>
                          sel.length === 1 && sel[0] === licencia.id_licencia
                            ? []
                            : [licencia.id_licencia]
                        );
                      }
                    }
                  }}
                >
                  <td className="px-4 py-2 border align-top">
                    {empleado.nombre} {empleado.apellido}
                  </td>
                  <td className="px-4 py-2 border align-top">
                    {licencia.tipo}
                  </td>
                  <td className="px-4 py-2 border align-top break-words max-w-[320px]">
                    {descripcionExpandida === licencia.id_licencia ? (
                      <div className="max-h-32 overflow-y-auto pr-1">
                        {licencia.descripcion}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDescripcionExpandida(null);
                          }}
                          className="ml-2 text-blue-600 underline text-xs hover:text-white hover:bg-blue-600 px-2 py-0.5 rounded"
                        >
                          mostrar menos
                        </button>
                      </div>
                    ) : (
                      <>
                        {licencia.descripcion.slice(0, 50)}...
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDescripcionExpandida(licencia.id_licencia);
                          }}
                          className="ml-2 text-blue-600 underline text-xs hover:text-white hover:bg-blue-600 px-2 py-0.5 rounded"
                        >
                          ver completo
                        </button>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2 border align-top">
                    {licencia.fecha_inicio
                      ? new Date(licencia.fecha_inicio).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-2 border align-top">
                    {licencia.fecha_fin
                      ? new Date(licencia.fecha_fin).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-2 border align-top max-w-[240px]">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        licencia.estado === "activa" ||
                        licencia.estado === "aprobada" ||
                        licencia.estado === "activa y verificada"
                          ? "bg-green-100 text-green-800"
                          : licencia.estado === "pendiente"
                          ? "bg-yellow-100 text-yellow-800"
                          : licencia.estado === "sugerencia"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {licencia.estado === "aprobada"
                        ? "aprobada"
                        : licencia.estado_sugerencia || licencia.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 border align-top break-words max-w-[300px]">
                    {motivoExpandido === licencia.id_licencia ? (
                      <div className="max-h-32 overflow-y-auto pr-1">
                        {licencia.motivo_rechazo}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMotivoExpandido(null);
                          }}
                          className="ml-2 text-blue-600 underline text-xs hover:text-white hover:bg-blue-600 px-2 py-0.5 rounded"
                        >
                          mostrar menos
                        </button>
                      </div>
                    ) : licencia.motivo_rechazo ? (
                      <>
                        {licencia.motivo_rechazo.slice(0, 30)}...
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMotivoExpandido(licencia.id_licencia);
                          }}
                          className="ml-2 text-blue-600 underline text-xs hover:text-white hover:bg-blue-600 px-2 py-0.5 rounded"
                        >
                          ver completo
                        </button>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 border align-top">
                    {licencia.certificado_url ? (
                      <a
                        href={`${import.meta.env.VITE_API_URL}/${
                          licencia.certificado_url
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver certificado
                      </a>
                    ) : (
                      "Sin certificado"
                    )}
                  </td>
                  <td className="px-4 py-2 border align-top">
                    {licencia.estado === "pendiente" && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            evaluarLicencia({
                              idLicencia: licencia.id_licencia,
                              estado: "aprobada",
                            });
                          }}
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalRechazo(licencia);
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLicenciaSeleccionada(licencia);
                            setModalNegociacionFecha(true);
                          }}
                          className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                        >
                          Modificar fechas
                        </button>
                      </div>
                    )}
                    {licencia.estado === "activa" && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            evaluarLicencia({
                              idLicencia: licencia.id_licencia,
                              estado: "activa y verificada",
                            });
                          }}
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Verificar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLicenciaSeleccionada(licencia);
                            setModalInvalidacionOpen(true);
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Invalidar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Modal de rechazo */}
        {modalRechazoOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow space-y-4">
              <h2 className="text-lg font-semibold">
                Indique el motivo del rechazo
              </h2>
              <textarea
                className="w-full p-2 border border-gray-300 rounded resize-none"
                rows="4"
                placeholder="Escriba el motivo del rechazo..."
                value={motivoRechazo}
                onChange={(e) => {
                  setMotivoRechazo(e.target.value);
                  setError("");
                }}
              />
              <MensajeAlerta texto={error} tipo="error" />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalRechazoOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (motivoRechazo.trim()) {
                      evaluarLicencia({
                        estado: "rechazada",
                        idLicencia: licenciaSeleccionada.id_licencia,
                      });
                      setModalRechazoOpen(false);
                    } else {
                      setError(
                        "Debe indicar un motivo para rechazar la licencia."
                      );
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalInvalidacionOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow space-y-4">
              <h2 className="text-lg font-semibold">
                Indique el motivo de invalidacion de licencia
              </h2>
              <textarea
                className="w-full p-2 border border-gray-300 rounded resize-none"
                rows="4"
                placeholder="Las fechas del certificado no coninciden..."
                value={motivoRechazo}
                onChange={(e) => {
                  setMotivoRechazo(e.target.value);
                  setError("");
                }}
              />
              <MensajeAlerta texto={error} tipo="error" />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalInvalidacionOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (motivoRechazo.trim()) {
                      evaluarLicencia({
                        estado: "invalidada",
                        idLicencia: licenciaSeleccionada.id_licencia,
                      });
                      setModalInvalidacionOpen(false);
                    } else {
                      setError(
                        "Debe indicar un motivo para rechazar la licencia."
                      );
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de negociación de fechas */}
        {modalNegociacionFecha && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow space-y-4">
              <h2 className="text-lg font-semibold">
                Indique las fechas de validez de la licencia
              </h2>
              <section>
                <label className="text-sm font-medium text-gray-700">
                  Rango de fechas
                </label>
                <DayPicker
                  className="flex justify-center"
                  mode="range"
                  onSelect={handleUpdateFecha}
                  disabled={{ before: hoy }}
                  selected={{
                    from: licenciaSeleccionada.fecha_inicio,
                    to: licenciaSeleccionada.fecha_fin,
                  }}
                />
              </section>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalNegociacionFecha(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    sugerirFechas().then(() => setModalNegociacionFecha(false));
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Sugerir fechas
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
