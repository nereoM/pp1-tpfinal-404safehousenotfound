import React, { useEffect, useState } from "react";

export default function RendimientoAnalistasTable({ onSuccess }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState("");
    const [saving, setSaving] = useState(false);

    // Cargar datos actuales
    useEffect(() => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/empleados-datos-rendimiento-manager`, {
            credentials: "include",
        })
            .then(res => res.json())
            .then(data => {
                if (data.datos_empleados) setRows(data.datos_empleados);
                else setMensaje("No se encontraron datos.");
            })
            .catch(() => setMensaje("Error al cargar datos."))
            .finally(() => setLoading(false));
    }, []);

    // Manejar edición de celdas
    const handleChange = (idx, field, value) => {
        setRows(rows =>
            rows.map((row, i) =>
                i === idx ? { ...row, [field]: value } : row
            )
        );
    };

    // Enviar datos editados
    const handleGuardar = async () => {
        setSaving(true);
        setMensaje("");
        try {
            const payload = rows.map(row => ({
                id_empleado: row.id_usuario,
                horas_extras: Number(row.horas_extra_finde) || 0,
                horas_capacitacion: Number(row.horas_capacitacion) || 0,
                ausencias_injustificadas: Number(row.ausencias_injustificadas) || 0,
                llegadas_tarde: Number(row.llegadas_tarde) || 0,
                salidas_tempranas: Number(row.salidas_tempranas) || 0,
            }));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cargar-rendimientos-empleados`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ empleados: payload }),
            });

            const contentType = res.headers.get("content-type") || "";
            if (
                res.ok &&
                (
                    (contentType && (contentType.includes("text/csv") || contentType.includes("application/vnd.ms-excel")))
                    || (!contentType && res.status === 200)
                )
            ) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "rendimientos_empleados.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                setMensaje("Datos guardados y archivo descargado correctamente.");
                if (onSuccess) onSuccess();
            } else if (contentType.includes("application/json")) {
                const data = await res.json();
                setMensaje(data.error || "Error al guardar.");
            } else {
                setMensaje("Respuesta inesperada del servidor.");
            }
        } catch {
            setMensaje("Error de red.");
        }
        setSaving(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Editar Métricas de Analistas</h2>
            {mensaje && <div className="mb-2 text-indigo-700">{mensaje}</div>}
            {loading ? (
                <div className="text-gray-500">Cargando datos...</div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300 text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 border">Nombre</th>
                                    <th className="p-2 border">Horas Capacitación</th>
                                    <th className="p-2 border">Horas Extra Finde</th>
                                    <th className="p-2 border">Ausencias Injustificadas</th>
                                    <th className="p-2 border">Llegadas Tarde</th>
                                    <th className="p-2 border">Salidas Tempranas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={row.id_usuario} className="hover:bg-blue-50">
                                        <td className="p-2 border">{row.nombre}</td>
                                        <td className="p-2 border">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.horas_capacitacion}
                                                onChange={e => handleChange(idx, "horas_capacitacion", e.target.value)}
                                                className="w-20 border rounded px-1"
                                            />
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.horas_extra_finde}
                                                onChange={e => handleChange(idx, "horas_extra_finde", e.target.value)}
                                                className="w-20 border rounded px-1"
                                            />
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.ausencias_injustificadas}
                                                onChange={e => handleChange(idx, "ausencias_injustificadas", e.target.value)}
                                                className="w-20 border rounded px-1"
                                            />
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.llegadas_tarde}
                                                onChange={e => handleChange(idx, "llegadas_tarde", e.target.value)}
                                                className="w-20 border rounded px-1"
                                            />
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.salidas_tempranas}
                                                onChange={e => handleChange(idx, "salidas_tempranas", e.target.value)}
                                                className="w-20 border rounded px-1"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleGuardar}
                            disabled={saving}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}