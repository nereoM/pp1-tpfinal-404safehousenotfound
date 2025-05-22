import React, { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

export default function RiesgosAnalistasConTabla() {
    const [empleados, setEmpleados] = useState([]);
    const [resumen, setResumen] = useState({
        rendimiento: { alto: 0, medio: 0, bajo: 0 },
        rotacion: { alto: 0, medio: 0, bajo: 0 },
        despido: { alto: 0, medio: 0, bajo: 0 },
        renuncia: { alto: 0, medio: 0, bajo: 0 },
    });
    const [loading, setLoading] = useState(true);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroRendimiento, setFiltroRendimiento] = useState("");
    const [filtroRotacion, setFiltroRotacion] = useState("");
    const [filtroDespido, setFiltroDespido] = useState("");
    const [filtroRenuncia, setFiltroRenuncia] = useState("");

    const opcionesFiltro = ["", "Alto", "Medio", "Bajo"];

    const colorsNormal = {
        alto: "#EF4444",   // rojo
        medio: "#FBBF24",  // amarillo
        bajo: "#10B981",   // verde
    };

    const colorsInvertido = {
        alto: "#10B981",   // verde
        medio: "#FBBF24",  // amarillo
        bajo: "#EF4444",   // rojo
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/empleados-riesgo-analistas`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                    setEmpleados([]);
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                if (data && data.empleados) {
                    const resumenKey = (base) => ({
                        alto: base[`Alto Rendimiento`] || base["Alto"] || 0,
                        medio: base[`Medio Rendimiento`] || base["Medio"] || 0,
                        bajo: base[`Bajo Rendimiento`] || base["Bajo"] || 0,
                    });

                    setEmpleados(data.empleados);
                    setResumen({
                        rendimiento: resumenKey(data.resumen_riesgo),
                        rotacion: resumenKey(data.resumen_rotacion),
                        despido: resumenKey(data.resumen_despido),
                        renuncia: resumenKey(data.resumen_renuncia),
                    });
                }
                setLoading(false);
            } catch (error) {
                setEmpleados([]);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const resumenToPieData = (res, invertido = false) => {
        const col = invertido ? colorsInvertido : colorsNormal;
        return [
            { name: "Alto", value: res.alto, color: col.alto },
            { name: "Medio", value: res.medio, color: col.medio },
            { name: "Bajo", value: res.bajo, color: col.bajo },
        ];
    };

    const secciones = [
        { titulo: "Distribución de Rendimiento Predicho", resumen: resumen.rendimiento, descripcion: "Muestra cuántos empleados tienen alto, medio o bajo rendimiento." },
        { titulo: "Riesgo de Rotación", resumen: resumen.rotacion, descripcion: "Indica el riesgo de que los empleados roten de puesto o área." },
        { titulo: "Riesgo de Despido", resumen: resumen.despido, descripcion: "Indica el riesgo de que los empleados sean despedidos." },
        { titulo: "Riesgo de Renuncia", resumen: resumen.renuncia, descripcion: "Indica el riesgo de que los empleados renuncien voluntariamente." },
    ];

    // Normaliza para comparar filtros
    const normaliza = (valor) => {
        if (!valor) return "";
        return valor.toLowerCase().replace("rendimiento", "").replace("riesgo", "").trim();
    };

    // Función para filtrar empleados
    const empleadosFiltrados = useMemo(() => {
        return empleados.filter(emp => {
            const nombreLower = emp.nombre.toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            if (!nombreLower.includes(searchLower)) return false;

            if (
                filtroRendimiento &&
                normaliza(emp.clasificacion_rendimiento) !== normaliza(filtroRendimiento)
            ) return false;
            if (
                filtroRotacion &&
                normaliza(emp.riesgo_rotacion_predicho) !== normaliza(filtroRotacion)
            ) return false;
            if (
                filtroDespido &&
                normaliza(emp.riesgo_despido_predicho) !== normaliza(filtroDespido)
            ) return false;
            if (
                filtroRenuncia &&
                normaliza(emp.riesgo_renuncia_predicho) !== normaliza(filtroRenuncia)
            ) return false;

            return true;
        });
    }, [empleados, searchTerm, filtroRendimiento, filtroRotacion, filtroDespido, filtroRenuncia]);

    return (
        <motion.div
            className="p-6 bg-gray-100 min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <h2 className="text-3xl font-extrabold text-center text-blue-900 mb-8">
                📊 Riesgos y Rendimiento de Empleados
            </h2>

            {loading ? (
                <p className="text-center text-lg text-gray-500">Cargando datos...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {secciones.map(({ titulo, resumen, descripcion }, idx) => {
                            const invertido = titulo.includes("Rendimiento");
                            return (
                                <motion.div key={idx} className="bg-white p-5 rounded-2xl shadow-lg" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                                    <h3 className="text-xl font-bold text-center text-gray-800 mb-1">{titulo}</h3>
                                    <p className="text-md text-center text-gray-500 mb-4 font-medium">{descripcion}</p>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={resumenToPieData(resumen, invertido)}
                                                dataKey="value"
                                                nameKey="name"
                                                outerRadius={80}
                                                label
                                            >
                                                {resumenToPieData(resumen, invertido).map((entry, idx) => (
                                                    <Cell key={idx} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            );
                        })}
                    </div>  

                        {/* Controles de filtros */}
                        <div className="bg-white text-black p-5 rounded-2xl shadow-lg mb-6">
                            <h3 className="text-xl font-bold mb-4">Filtros y búsqueda</h3>

                            <div className="flex flex-wrap gap-4 justify-center items-center">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    className="border border-gray-300 rounded-md p-2 w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />

                                <div>
                                    <label className="mr-2 font-semibold">Rendimiento:</label>
                                    <select
                                        className="border border-gray-300 rounded-md p-2"
                                        value={filtroRendimiento}
                                        onChange={(e) => setFiltroRendimiento(e.target.value)}
                                    >
                                        {opcionesFiltro.map((opt, i) => (
                                            <option key={i} value={opt}>{opt || "Todos"}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mr-2 font-semibold">Rotación:</label>
                                    <select
                                        className="border border-gray-300 rounded-md p-2"
                                        value={filtroRotacion}
                                        onChange={(e) => setFiltroRotacion(e.target.value)}
                                    >
                                        {opcionesFiltro.map((opt, i) => (
                                            <option key={i} value={opt}>{opt || "Todos"}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mr-2 font-semibold">Despido:</label>
                                    <select
                                        className="border border-gray-300 rounded-md p-2"
                                        value={filtroDespido}
                                        onChange={(e) => setFiltroDespido(e.target.value)}
                                    >
                                        {opcionesFiltro.map((opt, i) => (
                                            <option key={i} value={opt}>{opt || "Todos"}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mr-2 font-semibold">Renuncia:</label>
                                    <select
                                        className="border border-gray-300 rounded-md p-2"
                                        value={filtroRenuncia}
                                        onChange={(e) => setFiltroRenuncia(e.target.value)}
                                    >
                                        {opcionesFiltro.map((opt, i) => (
                                            <option key={i} value={opt}>{opt || "Todos"}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <motion.div
                            className="bg-white p-6 rounded-2xl shadow-xl mt-4"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h3 className="text-2xl font-bold text-center text-blue-800 mb-4">📋 Detalle de Empleados</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border border-gray-200">
                                    <thead className="bg-blue-100 text-gray-900 font-bold text-base">
                                        <tr>
                                            {[
                                                "Nombre",
                                                "Rol",
                                                "Antigüedad",
                                                "Capacitación",
                                                "Ausencias",
                                                "Tarde",
                                                "Tempranas",
                                                "Desempeño Previo",
                                                "Predicción",
                                                "Fecha cálculo",
                                                "Rendimiento",
                                                "Rotación",
                                                "Despido",
                                                "Renuncia"
                                            ].map((col, i) => (
                                                <th key={i} className="p-3 border border-gray-300">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {empleadosFiltrados.length > 0 ? empleadosFiltrados.map((emp, idx) => (
                                            <tr key={emp.id_usuario} className={`text-gray-800 text-sm ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                                                <td className="p-2 border">{emp.nombre}</td>
                                                <td className="p-2 border">{emp.puesto || "Empleado"}</td>
                                                <td className="p-2 border">{emp.antiguedad}</td>
                                                <td className="p-2 border">{emp.horas_capacitacion}</td>
                                                <td className="p-2 border">{emp.ausencias_injustificadas}</td>
                                                <td className="p-2 border">{emp.llegadas_tarde}</td>
                                                <td className="p-2 border">{emp.salidas_tempranas}</td>
                                                <td className="p-2 border">{emp.desempeno_previo !== undefined && emp.desempeno_previo !== null ? emp.desempeno_previo : "-"}</td>
                                                <td className="p-2 border">{emp.rendimiento_futuro_predicho !== undefined && emp.rendimiento_futuro_predicho !== null ? emp.rendimiento_futuro_predicho.toFixed(2) : "-"}</td>
                                                <td className="p-2 border">{emp.fecha_calculo_rendimiento ? new Date(emp.fecha_calculo_rendimiento).toLocaleDateString() : "-"}</td>
                                                <td className="p-2 border font-semibold">{emp.clasificacion_rendimiento}</td>
                                                <td className="p-2 border">{emp.riesgo_rotacion_predicho}</td>
                                                <td className="p-2 border">{emp.riesgo_despido_predicho}</td>
                                                <td className="p-2 border">{emp.riesgo_renuncia_predicho}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={14} className="text-center p-4 text-gray-500">
                                                    No se encontraron empleados con esos criterios.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </>
            )}
                </motion.div>
            );
}