import React, { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { useExportarGraficos } from "../hooks/useExportarGraficos";
import { Download } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function RiesgosAnalistasConTabla() {
    const navigate = useNavigate();
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
    const [filtroRotacionIntencional, setFiltroRotacionIntencional] = useState("");

    const [periodos, setPeriodos] = useState([]);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");

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
        const fetchPeriodos = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/listar-periodos`, {
                    credentials: "include",
                });
                const data = await res.json();
                setPeriodos(data);
                if (data.length > 0) setPeriodoSeleccionado(data[0].id_periodo);
            } catch {
                setPeriodos([]);
            }
        };
        fetchPeriodos();
    }, []);

    useEffect(() => {
        if (!periodoSeleccionado) return;
        setLoading(true);
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/empleados-riesgo-analistas?periodo=${periodoSeleccionado}`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                    }
                );
                if (!response.ok) {
                    setEmpleados([]);
                    setResumen({
                        rendimiento: { alto: 0, medio: 0, bajo: 0 },
                        rotacion: { alto: 0, medio: 0, bajo: 0 },
                        despido: { alto: 0, medio: 0, bajo: 0 },
                        renuncia: { alto: 0, medio: 0, bajo: 0 },
                    });
                    setLoading(false);
                    return;
                }
                const data = await response.json();
                if (data && data.empleados && data.empleados.length > 0) {
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
                } else {
                    setEmpleados([]);
                    setResumen({
                        rendimiento: { alto: 0, medio: 0, bajo: 0 },
                        rotacion: { alto: 0, medio: 0, bajo: 0 },
                        despido: { alto: 0, medio: 0, bajo: 0 },
                        renuncia: { alto: 0, medio: 0, bajo: 0 },
                    });
                }
                setLoading(false);
            } catch (error) {
                setEmpleados([]);
                setResumen({
                    rendimiento: { alto: 0, medio: 0, bajo: 0 },
                    rotacion: { alto: 0, medio: 0, bajo: 0 },
                    despido: { alto: 0, medio: 0, bajo: 0 },
                    renuncia: { alto: 0, medio: 0, bajo: 0 },
                });
                setLoading(false);
            }
        };
        fetchData();
    }, [periodoSeleccionado]);

    useExportarGraficos(
        [
            { idElemento: "grafico-rendimiento-analistas", nombreArchivo: "riesgo_rendimiento_analistas" },
            { idElemento: "grafico-rotacion-analistas", nombreArchivo: "riesgo_rotacion_analistas" },
            { idElemento: "grafico-despido-analistas", nombreArchivo: "riesgo_despido_analistas" },
            { idElemento: "grafico-renuncia-analistas", nombreArchivo: "riesgo_renuncia_analistas" }
        ],
        !loading && empleados.length > 0
    );

    const resumenToPieData = (res, invertido = false) => {
        const col = invertido ? colorsInvertido : colorsNormal;
        return [
            { name: "Alto", value: res.alto, color: col.alto },
            { name: "Medio", value: res.medio, color: col.medio },
            { name: "Bajo", value: res.bajo, color: col.bajo },
        ];
    };

    const exportarGrafico = (idElemento, nombreArchivo) => {
        const elemento = document.getElementById(idElemento);
        if (!elemento) return;
        import("html-to-image").then(htmlToImage => {
            htmlToImage.toPng(elemento).then(dataUrl => {
                const link = document.createElement("a");
                link.download = `${nombreArchivo}.png`;
                link.href = dataUrl;
                link.click();
            });
        });
    };

    const descargarReporteRiesgos = async (formato) => {
        try {
            const ids = empleadosFiltrados.map(e => e.id_usuario).join(",");
            console.log(`Descargando reporte de riesgos para IDs: ${ids} en formato ${formato} y periodo ${periodoSeleccionado}`);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/reportes-riesgos?formato=${formato}&ids=${ids}&periodo=${periodoSeleccionado}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            if (!res.ok) throw new Error("Error al descargar el reporte");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download =
                formato === "pdf"
                    ? "reporte_riesgos.pdf"
                    : "reporte_riesgos.xlsx";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert("No se pudo descargar el reporte.");
        }
    };

    const colorRendimiento = {
        "Alto Rendimiento": "bg-green-200 text-green-900 font-bold",
        "Alto": "bg-green-200 text-green-900 font-bold",
        "Medio Rendimiento": "bg-yellow-100 text-yellow-900 font-bold",
        "Medio": "bg-yellow-100 text-yellow-900 font-bold",
        "Bajo Rendimiento": "bg-red-200 text-red-900 font-bold",
        "Bajo": "bg-red-200 text-red-900 font-bold",
    };

    const colorRiesgo = {
        "alto": "bg-red-200 text-red-900 font-bold",
        "medio": "bg-yellow-100 text-yellow-900 font-bold",
        "bajo": "bg-green-200 text-green-900 font-bold",
    };

    const secciones = [
        { titulo: "Distribución de Rendimiento Predicho", resumen: resumen.rendimiento, descripcion: "Muestra cuántos empleados tienen alto, medio o bajo rendimiento.", id: "grafico-rendimiento-analistas" },
        { titulo: "Riesgo de Rotación", resumen: resumen.rotacion, descripcion: "Indica el riesgo de que los empleados roten de puesto o área.", id: "grafico-rotacion-analistas" },
        { titulo: "Riesgo de Despido", resumen: resumen.despido, descripcion: "Indica el riesgo de que los empleados sean despedidos.", id: "grafico-despido-analistas" },
        { titulo: "Riesgo de Renuncia", resumen: resumen.renuncia, descripcion: "Indica el riesgo de que los empleados renuncien voluntariamente.", id: "grafico-renuncia-analistas" },
    ];

    // Normaliza para comparar filtros
    const normaliza = (valor) => {
        if (!valor) return "";
        return valor.toLowerCase().replace("rendimiento", "").replace("riesgo", "").trim();
    };

    // Función para filtrar empleados
    const empleadosFiltrados = useMemo(() => {
        return empleados.filter(emp => {
            const apellidoLower = emp.apellido.toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            if (!apellidoLower.includes(searchLower)) return false;

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
            if (
                filtroRotacionIntencional &&
                normaliza(emp.riesgo_rotacion_intencional) !== normaliza(filtroRotacionIntencional)
            ) return false;

            return true;
        });
    }, [empleados, searchTerm, filtroRendimiento, filtroRotacion, filtroDespido, filtroRenuncia, filtroRotacionIntencional]);

    const exportarTablaExcel = () => {
        const datos = empleadosFiltrados.map(emp => ({
            Nombre: emp.nombre,
            Apellido: emp.apellido,
            Rol: emp.puesto || "Empleado",
            Antigüedad: emp.antiguedad,
            Capacitación: emp.horas_capacitacion,
            Ausencias: emp.ausencias_injustificadas,
            Tarde: emp.llegadas_tarde,
            Tempranas: emp.salidas_tempranas,
            "Desempeño Previo": emp.desempeno_previo,
            Predicción: emp.rendimiento_futuro_predicho,
            "Fecha cálculo": emp.fecha_calculo_rendimiento
                ? new Date(emp.fecha_calculo_rendimiento).toLocaleDateString()
                : "-",
            Rendimiento: emp.clasificacion_rendimiento,
            Rotación: emp.riesgo_rotacion_predicho,
            Despido: emp.riesgo_despido_predicho,
            Renuncia: emp.riesgo_renuncia_predicho,
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Empleados");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "empleados_riesgo.xlsx");
    };

    return (
        <motion.div
            className="p-6 bg-gray-100 min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >

            {/* Flecha para volver */}
            <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
                title="Volver"
            >
                <ArrowLeft className="w-5 h-5" />
                Volver
            </button>

            <h2 className="text-3xl font-extrabold text-center text-blue-900 mb-8">
                Predicción de Riesgos y Rendimiento de Analistas y Empleados
            </h2>

            <div className="text-black mb-6 flex flex-col items-center">
                <label className="font-semibold mb-1">Seleccionar periodo:</label>
                <select
                    className="border border-gray-300 rounded-md p-2 w-64"
                    value={periodoSeleccionado}
                    onChange={e => setPeriodoSeleccionado(e.target.value)}
                    disabled={periodos.length === 0}
                >
                    {periodos.map(p => (
                        <option key={p.id_periodo} value={p.id_periodo}>
                            {p.nombre_periodo} ({p.fecha_inicio} a {p.fecha_fin})
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p className="text-center text-lg text-gray-500">Cargando datos de predicción...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {secciones.map(({ titulo, resumen, descripcion, id }, idx) => {
                            const invertido = titulo.includes("Rendimiento");
                            return (
                                <motion.div
                                    key={idx}
                                    className="bg-white p-5 rounded-2xl shadow-lg"
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Bloque a exportar */}
                                    <div
                                        id={id}
                                        style={{
                                            background: "#fff",
                                            padding: 16,
                                            borderRadius: 12,
                                            color: "#000"
                                        }}
                                    >
                                        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 18, marginBottom: 4 }}>
                                            {titulo}
                                        </div>
                                        <div style={{ textAlign: "center", fontSize: 14, color: "#555", marginBottom: 8 }}>
                                            {descripcion} <br></br> <b>Estos valores son estimaciones hipotéticas generadas por modelos predictivos.</b>
                                        </div>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={resumenToPieData(resumen, invertido)}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    outerRadius={80}
                                                    label
                                                >
                                                    {resumenToPieData(resumen, invertido).map((entry, idx2) => (
                                                        <Cell key={idx2} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <button
                                        className="mt-2 flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition text-xs"
                                        onClick={() => exportarGrafico(id, secciones[idx].nombreArchivo || id)}
                                        title="Descargar imagen del gráfico"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        Descargar imagen
                                    </button>
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
                                placeholder="Buscar por apellido..."
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

                            <div>
                                <label className="mr-2 font-semibold">Rotación Intencional:</label>
                                <select
                                    className="border border-gray-300 rounded-md p-2"
                                    value={filtroRotacionIntencional}
                                    onChange={e => setFiltroRotacionIntencional(e.target.value)}
                                >
                                    {opcionesFiltro.map((opt, i) => (
                                        <option key={i} value={opt}>{opt || "Todos"}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-2 text-xs text-gray-500 text-center">
                                <b>Nota:</b> Todos los datos y predicciones mostrados en este panel son <b>hipotéticos</b> y generados automáticamente por modelos de predicción. No representan evaluaciones reales ni decisiones efectivas de RRHH.
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 mb-6">
                        <button
                            onClick={() => descargarReporteRiesgos("excel")}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 transition font-semibold shadow"
                            title="Descargar reporte de riesgos en Excel"
                        >
                            <Download className="w-5 h-5" />
                            Descargar Reporte Excel
                        </button>
                        <button
                            onClick={() => descargarReporteRiesgos("pdf")}
                            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-900 transition font-semibold shadow"
                            title="Descargar reporte de riesgos en PDF"
                        >
                            <Download className="w-5 h-5" />
                            Descargar Reporte PDF
                        </button>
                    </div>

                    <motion.div
                        className="bg-white p-6 rounded-2xl shadow-xl mt-4"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-2xl font-bold text-center text-blue-800 mb-4">
                            Detalle de Analistas y Empleados (Predicción)
                        </h3>
                        <button
                            className="mb-3 flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition text-xs"
                            onClick={() => exportarGrafico("tabla-empleados", "tabla_riesgo")}
                            title="Descargar imagen de la tabla"
                        >
                            <ImageIcon className="w-4 h-4" />
                            Descargar tabla como imagen
                        </button>

                        <button
                            className="mb-3 flex items-center gap-2 px-3 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300 transition text-xs"
                            onClick={exportarTablaExcel}
                            title="Descargar tabla como Excel"
                        >
                            <Download className="w-5 h-5" />
                            Descargar tabla Excel
                        </button>
                        <div id="tabla-empleados" className="overflow-x-auto">
                            <table className="w-full text-xs text-left border border-gray-200">
                                <thead className="bg-blue-100 text-gray-900 font-bold text-xs">
                                    <tr>
                                        {[
                                            "Nombre",
                                            "Apellido",
                                            "Rol",
                                            "Antigüedad",
                                            "Horas de Capacitación",
                                            "Ausencias",
                                            "Llegadas Tarde",
                                            "Salidas Tempranas",
                                            "Desempeño Previo",
                                            "Predicción Actual",
                                            "Fecha cálculo",
                                            "Rendimiento",
                                            "Rotación",
                                            "Despido",
                                            "Renuncia",
                                            "Rotación Intencional",
                                            "Último Rend. Manual",
                                            "Postulaciones"
                                        ].map((col, i) => (
                                            <th key={i} className="p-3 border border-gray-300">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {empleadosFiltrados.length > 0 ? empleadosFiltrados.map((emp, idx) => (
                                        <tr key={emp.id_usuario} className={`text-gray-800 text-xs ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                                            <td className="p-2 border">{emp.nombre}</td>
                                            <td className="p-2 border">{emp.apellido}</td>
                                            <td className="p-2 border">{emp.puesto || "Empleado"}</td>
                                            <td className="p-2 border">{emp.antiguedad}</td>
                                            <td className="p-2 border">{emp.horas_capacitacion}</td>
                                            <td className="p-2 border">{emp.ausencias_injustificadas}</td>
                                            <td className="p-2 border">{emp.llegadas_tarde}</td>
                                            <td className="p-2 border">{emp.salidas_tempranas}</td>
                                            <td className="p-2 border">{emp.desempeno_previo !== undefined && emp.desempeno_previo !== null ? emp.desempeno_previo : "-"}</td>
                                            <td className="p-2 border">{emp.rendimiento_futuro_predicho !== undefined && emp.rendimiento_futuro_predicho !== null ? emp.rendimiento_futuro_predicho.toFixed(2) : "-"}</td>
                                            <td className="p-2 border">{emp.fecha_calculo_rendimiento ? new Date(emp.fecha_calculo_rendimiento).toLocaleDateString() : "-"}</td>
                                            <td className={`p-2 border font-semibold ${colorRendimiento[emp.clasificacion_rendimiento] || ""}`}>{emp.clasificacion_rendimiento}</td>
                                            <td className={`p-2 border ${colorRiesgo[emp.riesgo_rotacion_predicho] || ""}`}>{emp.riesgo_rotacion_predicho}</td>
                                            <td className={`p-2 border ${colorRiesgo[emp.riesgo_despido_predicho] || ""}`}>{emp.riesgo_despido_predicho}</td>
                                            <td className={`p-2 border ${colorRiesgo[emp.riesgo_renuncia_predicho] || ""}`}>{emp.riesgo_renuncia_predicho}</td>
                                            <td className={`p-2 border ${colorRiesgo[String(emp.riesgo_rotacion_intencional).toLowerCase()] || ""}`}>
                                                {emp.riesgo_rotacion_intencional !== undefined && emp.riesgo_rotacion_intencional !== null
                                                    ? String(emp.riesgo_rotacion_intencional).toLowerCase()
                                                    : "-"}
                                            </td>
                                            <td className="p-2 border">{emp.ultimo_rendimiento_manual !== undefined && emp.ultimo_rendimiento_manual !== null ? emp.ultimo_rendimiento_manual : "-"}</td>
                                            <td className="p-2 border">{emp.cantidad_postulaciones !== undefined && emp.cantidad_postulaciones !== null ? emp.cantidad_postulaciones : "-"}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={18} className="text-center p-4 text-gray-500">
                                                No se encontraron empleados con esos criterios.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            <b>Nota:</b> Los valores de predicción y clasificación son generados automáticamente y no deben considerarse decisiones reales de RRHH.
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}