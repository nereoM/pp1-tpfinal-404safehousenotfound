import React, { useEffect, useState } from "react";

export default function RendimientoAnalistasTable({ onSuccess }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("success");
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
            .catch(() => {
                setMensaje("Error al cargar datos.");
                setTipoMensaje("error");
            })
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
        setTipoMensaje("success");

        const campos = [
            "horas_extra_finde",
            "horas_capacitacion",
            "ausencias_injustificadas",
            "llegadas_tarde",
            "salidas_tempranas"
        ];

        // Empleados con todos los campos completos y válidos
        const empleadosValidos = rows.filter(row =>
            campos.every(key =>
                row[key] !== "" &&
                row[key] !== undefined &&
                row[key] !== null &&
                !isNaN(Number(row[key]))
            )
        );

        // Empleados con al menos un campo numérico completado pero no todos
        const empleadosIncompletos = rows.filter(row => {
            const completados = campos.filter(key =>
                row[key] !== "" &&
                row[key] !== undefined &&
                row[key] !== null &&
                !isNaN(Number(row[key]))
            ).length;
            return completados > 0 && completados < campos.length;
        });

        if (empleadosIncompletos.length > 0) {
            setSaving(false);
            setTipoMensaje("error");
            setMensaje(
                `Completa todos los campos numéricos para el empleado ${empleadosIncompletos[0].nombre} ${empleadosIncompletos[0].apellido}.`
            );
            setTimeout(() => setMensaje(""), 5000);
            return;
        }

        if (empleadosValidos.length === 0) {
            setSaving(false);
            setTipoMensaje("error");
            setMensaje("Ningún valor fue modificado.");
            setTimeout(() => setMensaje(""), 5000);
            return;
        }

        try {
            const payload = empleadosValidos.map(row => ({
                id_empleado: row.id_usuario,
                horas_extras: Number(row.horas_extra_finde),
                horas_capacitacion: Number(row.horas_capacitacion),
                ausencias_injustificadas: Number(row.ausencias_injustificadas),
                llegadas_tarde: Number(row.llegadas_tarde),
                salidas_tempranas: Number(row.salidas_tempranas)
            }));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cargar-rendimientos-empleados`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ empleados: payload }),
            });

            const contentType = res.headers.get("content-type") || "";

            if (res.ok) {
                let data = null;
                try {
                    if (contentType.includes("application/json")) {
                        data = await res.json();
                        setMensaje(data.message || "Datos guardados correctamente.");
                    } else {
                        await res.text();
                        setMensaje("Datos guardados correctamente.");
                    }
                } catch {
                    setMensaje("Datos guardados correctamente.");
                }
                setTipoMensaje("success");
            } else {
                setTipoMensaje("error");
                setMensaje("Error: Los datos no fueron modificados.");
                await res.text();
            }
        } catch {
            setTipoMensaje("error");
            setMensaje("Error de red.");
        }
        setSaving(false);
        setTimeout(() => setMensaje(""), 5000);
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold mb-6 text-blue-900 flex items-center gap-2">
                Editar Métricas de Analistas
            </h2>
            {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-500 text-lg">
                    <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Cargando datos...
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="p-3 border-b text-left font-semibold text-blue-900">Nombre</th>
                                    <th className="p-3 border-b text-left font-semibold text-blue-900">Apellido</th>
                                    <th className="p-3 border-b text-left font-semibold text-blue-900">Horas Capacitación</th>
                                    <th className="p-3 border-b text-left font-semibold text-blue-900">Horas Extra Finde</th>
                                    <th className="p-3 border-b text-left font-semibold text-blue-900">Ausencias Injustificadas</th>
                                    <th className="p-3 border-b text-left font-semibold text-blue-900">Llegadas Tarde</th>
                                    <th className="p-3 border-b text-left font-semibold text-blue-900">Salidas Tempranas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={row.id_usuario} className="hover:bg-blue-50 transition">
                                        <td className="p-2 border-b">{row.nombre}</td>
                                        <td className="p-2 border-b">{row.apellido}</td>
                                        <td className="p-2 border-b">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.horas_capacitacion}
                                                onChange={e => handleChange(idx, "horas_capacitacion", e.target.value)}
                                                className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                                            />
                                        </td>
                                        <td className="p-2 border-b">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.horas_extra_finde}
                                                onChange={e => handleChange(idx, "horas_extra_finde", e.target.value)}
                                                className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                                            />
                                        </td>
                                        <td className="p-2 border-b">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.ausencias_injustificadas}
                                                onChange={e => handleChange(idx, "ausencias_injustificadas", e.target.value)}
                                                className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                                            />
                                        </td>
                                        <td className="p-2 border-b">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.llegadas_tarde}
                                                onChange={e => handleChange(idx, "llegadas_tarde", e.target.value)}
                                                className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                                            />
                                        </td>
                                        <td className="p-2 border-b">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.salidas_tempranas}
                                                onChange={e => handleChange(idx, "salidas_tempranas", e.target.value)}
                                                className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleGuardar}
                            disabled={saving}
                            className={`px-6 py-2 rounded font-bold shadow transition
                                ${saving
                                    ? "bg-indigo-300 text-white cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                    </svg>
                                    Guardando...
                                </span>
                            ) : "Guardar Cambios"}
                        </button>
                    </div>
                    {/* Mensaje de éxito o error abajo */}
                    {mensaje && (
                        <div
                            className={`fixed left-1/2 bottom-8 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold transition-all z-50
                                ${tipoMensaje === "success"
                                    ? "bg-green-100 text-green-800 border border-green-300"
                                    : "bg-red-100 text-red-800 border border-red-300"
                                }`}
                        >
                            {mensaje}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}