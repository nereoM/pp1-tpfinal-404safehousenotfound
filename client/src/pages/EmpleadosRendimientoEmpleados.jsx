import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useExportarGraficos } from "../hooks/useExportarGraficos";

export default function EmpleadosRendimiento() {
    const [empleados, setEmpleados] = useState([]);
    const [resumen, setResumen] = useState({ alto: 0, medio: 0, bajo: 0 });
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState(null);
    const [tipoMensaje, setTipoMensaje] = useState("success");
    const [notificandoId, setNotificandoId] = useState(null);

    // Filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroClasificacion, setFiltroClasificacion] = useState("");
    const [filtroRol, setFiltroRol] = useState("");

    const opcionesFiltroClasificacion = ["", "Alto Rendimiento", "Medio Rendimiento", "Bajo Rendimiento"];
    const opcionesFiltroRol = ["", ...Array.from(new Set(empleados.map(e => e.puesto || "Analista")))];

    const rendimientoColors = {
        'Alto Rendimiento': '#10B981',   // Verde
        'Medio Rendimiento': '#FBBF24',  // Amarillo
        'Bajo Rendimiento': '#EF4444'    // Rojo
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/empleados-rendimiento-reclutador`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    setEmpleados([]);
                    setResumen({ alto: 0, medio: 0, bajo: 0 });
                    setLoading(false);
                    return;
                }

                const data = await response.json();

                if (data && data.empleados) {
                    setEmpleados(data.empleados);

                    const calcularPromedio = (filtro) => {
                        const filtrados = data.empleados.filter((e) => e.clasificacion_rendimiento === filtro);
                        if (filtrados.length === 0) return 0;
                        const suma = filtrados.reduce((acc, cur) => acc + cur.rendimiento_futuro_predicho, 0);
                        return (suma / filtrados.length).toFixed(2);
                    };

                    setResumen({
                        alto: calcularPromedio('Alto Rendimiento'),
                        medio: calcularPromedio('Medio Rendimiento'),
                        bajo: calcularPromedio('Bajo Rendimiento'),
                    });
                }

                setLoading(false);
            } catch (error) {
                setEmpleados([]);
                setResumen({ alto: 0, medio: 0, bajo: 0 });
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useExportarGraficos(
  [
    { idElemento: "grafico-rendimiento-empleados", nombreArchivo: "rendimiento_empleados" },
    { idElemento: "grafico-distribucion-empleados", nombreArchivo: "distribucion_empleados" },
    { idElemento: "grafico-promedio-empleados", nombreArchivo: "promedios_empleados" },
    { idElemento: "grafico-cantidad-empleados", nombreArchivo: "cantidad_empleados" }
  ],
  !loading && empleados.length > 0
);


    const resumenData = [
        { name: 'Alto Rendimiento', value: parseFloat(resumen.alto), color: rendimientoColors['Alto Rendimiento'] },
        { name: 'Medio Rendimiento', value: parseFloat(resumen.medio), color: rendimientoColors['Medio Rendimiento'] },
        { name: 'Bajo Rendimiento', value: parseFloat(resumen.bajo), color: rendimientoColors['Bajo Rendimiento'] }
    ];

    const cantidadPorRendimiento = [
        {
            name: 'Alto Rendimiento',
            value: empleados.filter(e => e.clasificacion_rendimiento === 'Alto Rendimiento').length,
            color: rendimientoColors['Alto Rendimiento']
        },
        {
            name: 'Medio Rendimiento',
            value: empleados.filter(e => e.clasificacion_rendimiento === 'Medio Rendimiento').length,
            color: rendimientoColors['Medio Rendimiento']
        },
        {
            name: 'Bajo Rendimiento',
            value: empleados.filter(e => e.clasificacion_rendimiento === 'Bajo Rendimiento').length,
            color: rendimientoColors['Bajo Rendimiento']
        }
    ];

    const colorRendimiento = {
        "Alto Rendimiento": "bg-green-200 text-green-900 font-bold",
        "Alto": "bg-green-200 text-green-900 font-bold",
        "Medio Rendimiento": "bg-yellow-100 text-yellow-900 font-bold",
        "Medio": "bg-yellow-100 text-yellow-900 font-bold",
        "Bajo Rendimiento": "bg-red-200 text-red-900 font-bold",
        "Bajo": "bg-red-200 text-red-900 font-bold",
    };

    const notificarBajoRendimiento = async (id_analista) => {
        setNotificandoId(id_analista); // Bloquea el botón
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/notificar-bajo-rendimiento-empleados/${id_analista}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                }
            );
            const data = await response.json();
            if (response.ok) {
                setTipoMensaje("success");
                setMensaje("Notificación enviada correctamente.");
            } else {
                setTipoMensaje("error");
                setMensaje(data.error || "❌ Error al enviar la notificación.");
            }
        } catch (error) {
            setTipoMensaje("error");
            setMensaje("❌ Error al enviar la notificación.");
        }
        setNotificandoId(null); // Desbloquea el botón
        setTimeout(() => setMensaje(null), 2000); // Oculta el mensaje después de 5 segundos
    };

    // Animación y visual de Riesgos + Filtros
    const empleadosFiltrados = useMemo(() => {
        return empleados.filter(emp => {
            const apellidoLower = emp.apellido.toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            if (!apellidoLower.includes(searchLower)) return false;
            if (filtroClasificacion && emp.clasificacion_rendimiento !== filtroClasificacion) return false;
            if (filtroRol && (emp.puesto || "Analista") !== filtroRol) return false;
            return true;
        });
    }, [empleados, searchTerm, filtroClasificacion, filtroRol]);

    return (
        <motion.div
            className="p-6 bg-gray-100 min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <h2 className="text-3xl font-extrabold text-center text-blue-900 mb-8">
                Rendimiento Futuro de Empleados
            </h2>

            {loading ? (
                <p className="text-center text-lg text-gray-500">Cargando datos...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <motion.div className="bg-white p-5 rounded-2xl shadow-lg" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                            <h3 className="text-xl font-bold text-center text-gray-800 mb-1">Resumen de Rendimiento</h3>
                            <div id="grafico-rendimiento-empleados">
                            <p className="text-sm text-center text-gray-500 mb-4">Visualización general de los promedios de métricas relevantes por clasificación de rendimiento.</p>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={resumenData} dataKey="value" nameKey="name" outerRadius={80} label>
                                        {resumenData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div className="bg-white p-5 rounded-2xl shadow-lg" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                            <h3 className="text-xl font-bold text-center text-gray-800 mb-1">Distribución de empleados por rendimiento</h3>
                            <p className="text-sm text-center text-gray-500 mb-4">Cantidad relativa de empleados agrupados según su clasificación de rendimiento.</p>
                            <div id="grafico-distribucion-empleados">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={cantidadPorRendimiento}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={80}
                                        label
                                    >
                                        {cantidadPorRendimiento.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div className="bg-white p-5 rounded-2xl shadow-lg" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                            <h3 className="text-xl font-bold text-center text-gray-800 mb-1">Promedio por Clasificación</h3>
                            <p className="text-sm text-center text-gray-500 mb-4">Comparación de valores promedio de diferentes métricas por clasificación de rendimiento.</p>
                            <div id="grafico-promedio-empleados">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={resumenData}>
                                    <XAxis dataKey="name" stroke="#000" />
                                    <YAxis stroke="#000" />
                                    <Tooltip />
                                    <Legend
                                        formatter={(value) => (
                                            <span style={{ color: '#000', fontWeight: 'bold' }}>{value}</span>
                                        )}
                                    />
                                    <Bar dataKey="value" name="Promedio">
                                        {resumenData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div className="bg-white p-5 rounded-2xl shadow-lg" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                            <h3 className="text-xl font-bold text-center text-gray-800 mb-1">Cantidad de empleados por rendimiento</h3>
                            <p className="text-sm text-center text-gray-500 mb-4">Número total de empleados en cada categoría de rendimiento.</p>
                            <div id="grafico-cantidad-empleados">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={cantidadPorRendimiento}>
                                    <XAxis dataKey="name" stroke="#000" />
                                    <YAxis stroke="#000" allowDecimals={false} />
                                    <Tooltip />
                                    <Legend
                                        formatter={(value) => (
                                            <span style={{ color: '#000', fontWeight: 'bold' }}>{value}</span>
                                        )}
                                    />
                                    <Bar dataKey="value" name="Cantidad">
                                        {cantidadPorRendimiento.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    {/* Controles de filtros */}
                    <div className="bg-white text-black p-5 rounded-2xl shadow-lg mb-6">
                        <h3 className="text-xl font-bold mb-4">Filtros y búsqueda</h3>
                        {mensaje && (
                            <div
                                className={`mx-auto my-4 w-fit px-6 py-3 rounded-lg shadow-md text-center text-lg font-semibold transition-all ${tipoMensaje === "success"
                                    ? "bg-green-100 text-green-800 border border-green-300"
                                    : "bg-red-100 text-red-800 border border-red-300"
                                    }`}
                            >
                                {mensaje}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-4 justify-center items-center">
                            <input
                                type="text"
                                placeholder="Buscar por apellido..."
                                className="border border-gray-300 rounded-md p-2 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div>
                                <label className="mr-2 font-semibold">Clasificación:</label>
                                <select
                                    className="border border-gray-300 rounded-md p-2"
                                    value={filtroClasificacion}
                                    onChange={(e) => setFiltroClasificacion(e.target.value)}
                                >
                                    {opcionesFiltroClasificacion.map((opt, i) => (
                                        <option key={i} value={opt}>{opt || "Todas"}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mr-2 font-semibold">Rol:</label>
                                <select
                                    className="border border-gray-300 rounded-md p-2"
                                    value={filtroRol}
                                    onChange={(e) => setFiltroRol(e.target.value)}
                                >
                                    {opcionesFiltroRol.map((opt, i) => (
                                        <option key={i} value={opt}>{opt || "Todos"}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        className="bg-blue-100 p-4 rounded-lg shadow-md mt-6"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-2xl font-bold text-center text-blue-800 mb-4">Detalle de Empleados</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-blue-200 text-black border border-gray-300">
                                        <th className="p-2 border border-gray-300">Nombre</th>
                                        <th className="p-2 border border-gray-300">Apellido</th>
                                        <th className="p-2 border border-gray-300">Rol</th>
                                        <th className="p-2 border border-gray-300">Previo</th>
                                        <th className="p-2 border border-gray-300">Extras</th>
                                        <th className="p-2 border border-gray-300">Antigüedad</th>
                                        <th className="p-2 border border-gray-300">Capacitación</th>
                                        <th className="p-2 border border-gray-300">Predicción</th>
                                        <th className="p-2 border border-gray-300">Clasificación</th>
                                        <th className="p-2 border border-gray-300">Fecha cálculo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empleadosFiltrados.length > 0 ? empleadosFiltrados.map((emp, index) => (
                                        <tr key={emp.id_usuario} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'} text-black`}>
                                            <td className="p-2 border border-gray-300">{emp.nombre}</td>
                                            <td className="p-2 border border-gray-300">{emp.apellido}</td>
                                            <td className="p-2 border border-gray-300">{emp.puesto || "Analista"}</td>
                                            <td className="p-2 border border-gray-300">{emp.desempeno_previo}</td>
                                            <td className="p-2 border border-gray-300">{emp.horas_extras}</td>
                                            <td className="p-2 border border-gray-300">{emp.antiguedad}</td>
                                            <td className="p-2 border border-gray-300">{emp.horas_capacitacion}</td>
                                            <td className="p-2 border border-gray-300">{emp.rendimiento_futuro_predicho !== undefined && emp.rendimiento_futuro_predicho !== null ? emp.rendimiento_futuro_predicho.toFixed(2) : '-'}</td>
                                            <td className={`p-2 border font-semibold ${colorRendimiento[emp.clasificacion_rendimiento] || ""}`}>
                                                {emp.clasificacion_rendimiento === "Bajo Rendimiento" ? (
                                                    <button
                                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-700 transition disabled:opacity-60 text-sm"
                                                        onClick={() => notificarBajoRendimiento(emp.id_usuario)}
                                                        title="Notificar bajo rendimiento"
                                                        disabled={notificandoId === emp.id_usuario}
                                                    >
                                                        {notificandoId === emp.id_usuario ? "Enviando notificación..." : "Notificar Bajo Rendimiento"}
                                                    </button>
                                                ) : (
                                                    emp.clasificacion_rendimiento
                                                )}
                                            </td>
                                            <td className="p-2 border border-gray-300">{emp.fecha_calculo_rendimiento ? new Date(emp.fecha_calculo_rendimiento).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={10} className="text-center p-4 text-gray-500">
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