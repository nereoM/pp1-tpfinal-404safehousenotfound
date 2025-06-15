import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function PeriodosEmpresaModal({ open, onClose, apiUrl, showToast }) {
    const [periodos, setPeriodos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nuevoPeriodo, setNuevoPeriodo] = useState({
        nombre_periodo: "",
        horas_laborales_por_dia: 8,
    });
    const [creando, setCreando] = useState(false);
    const [rangoFechas, setRangoFechas] = useState({ from: undefined, to: undefined });
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef(null);

    // Cerrar el calendario al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        }
        if (showCalendar) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showCalendar]);

    // Cargar periodos al abrir el modal
    useEffect(() => {
        if (open) fetchPeriodos();
        // eslint-disable-next-line
    }, [open]);

    const fetchPeriodos = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/listar-periodos`, {
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) setPeriodos(data);
            else showToast(data.error || "Error al obtener periodos", "error");
        } catch (err) {
            showToast("Error al conectar con el servidor", "error");
        } finally {
            setLoading(false);
        }
    };

    const cerrarPeriodo = async (id_periodo) => {
        try {
            const res = await fetch(`${apiUrl}/api/cerrar-periodo/${id_periodo}`, {
                method: "PUT",
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.mensaje || "Periodo cerrado correctamente", "success");
                fetchPeriodos();
            } else {
                showToast(data.error || "Error al cerrar el periodo", "error");
            }
        } catch (err) {
            showToast("Error al conectar con el servidor", "error");
        }
    };

    const crearPeriodo = async (e) => {
        e.preventDefault();
        setCreando(true);
        try {
            const res = await fetch(`${apiUrl}/api/configurar-periodo`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...nuevoPeriodo,
                    fecha_inicio: rangoFechas.from ? rangoFechas.from.toISOString().slice(0, 10) : "",
                    fecha_fin: rangoFechas.to ? rangoFechas.to.toISOString().slice(0, 10) : "",
                }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.mensaje || "Periodo creado correctamente", "success");
                setNuevoPeriodo({
                    nombre_periodo: "",
                    horas_laborales_por_dia: 8,
                });
                setRangoFechas({ from: undefined, to: undefined });
                fetchPeriodos();
            } else {
                showToast(data.error || "Error al crear el periodo", "error");
            }
        } catch (err) {
            showToast("Error al conectar con el servidor", "error");
        } finally {
            setCreando(false);
        }
    };

    if (!open) return null;

    return (
        <div className="text-black fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Gestión de Periodos</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>
                <h3 className="font-semibold mb-2">Periodos existentes</h3>
                {loading ? (
                    <div className="text-center py-4">Cargando periodos...</div>
                ) : periodos.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No hay periodos configurados.</div>
                ) : (
                    <table className="w-full mb-4 text-sm border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Nombre</th>
                                <th className="p-2 border">Inicio</th>
                                <th className="p-2 border">Fin</th>
                                <th className="p-2 border">Estado</th>
                                <th className="p-2 border">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periodos.map((p) => (
                                <tr key={p.id_periodo}>
                                    <td className="p-2 border">{p.nombre_periodo}</td>
                                    <td className="p-2 border">{p.fecha_inicio}</td>
                                    <td className="p-2 border">{p.fecha_fin}</td>
                                    <td className="p-2 border">{p.estado}</td>
                                    <td className="p-2 border">
                                        {p.estado === "activo" ? (
                                            <button
                                                onClick={() => cerrarPeriodo(p.id_periodo)}
                                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-800"
                                            >
                                                Cerrar
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <h3 className="font-semibold mb-2 mt-6">Crear nuevo periodo</h3>
                <form onSubmit={crearPeriodo} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1">Nombre del periodo</label>
                        <input
                            type="text"
                            required
                            value={nuevoPeriodo.nombre_periodo}
                            onChange={(e) =>
                                setNuevoPeriodo((prev) => ({ ...prev, nombre_periodo: e.target.value }))
                            }
                            className="w-full border px-2 py-1 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Horas laborales por día</label>
                        <input
                            type="number"
                            min={1}
                            max={24}
                            required
                            value={nuevoPeriodo.horas_laborales_por_dia}
                            onChange={(e) =>
                                setNuevoPeriodo((prev) => ({
                                    ...prev,
                                    horas_laborales_por_dia: e.target.value,
                                }))
                            }
                            className="w-full border px-2 py-1 rounded"
                        />
                    </div>
                    <div className="sm:col-span-2 mb-4 flex flex-col items-center justify-center">
                        <label className="block text-xs font-semibold mb-1 self-start">Rango de fechas</label>
                        <DayPicker
                            mode="range"
                            selected={rangoFechas}
                            onSelect={setRangoFechas}
                            showOutsideDays
                            className="bg-white rounded p-4 mx-auto"
                        />
                        <div className="mt-2 text-sm text-gray-700">
                            {rangoFechas.from && rangoFechas.to
                                ? `${rangoFechas.from.toLocaleDateString()} - ${rangoFechas.to.toLocaleDateString()}`
                                : "Selecciona un rango de fechas"}
                        </div>
                    </div>
                    <div className="sm:col-span-2 flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={creando || !rangoFechas.from || !rangoFechas.to}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            {creando ? "Creando..." : "Crear periodo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}