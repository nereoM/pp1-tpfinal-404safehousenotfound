import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RiesgosAnalistasConTabla() {
    const [empleados, setEmpleados] = useState([]);
    const [resumen, setResumen] = useState({
        rendimiento: { alto: 0, medio: 0, bajo: 0 },
        rotacion: { alto: 0, medio: 0, bajo: 0 },
        despido: { alto: 0, medio: 0, bajo: 0 },
        renuncia: { alto: 0, medio: 0, bajo: 0 }
    });
    const [loading, setLoading] = useState(true);

    const colors = {
        alto: "#F87171",    // Rojo
        medio: "#FDE68A",   // Amarillo
        bajo: "#A7F3D0"     // Verde
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/empleados-riesgo-analistas`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    setEmpleados([]);
                    setLoading(false);
                    return;
                }

                const data = await response.json();

                if (data && data.empleados) {
                    setEmpleados(data.empleados);

                    const resumenRendimiento = {
                        alto: data.resumen_riesgo["Alto Rendimiento"] || 0,
                        medio: data.resumen_riesgo["Medio Rendimiento"] || 0,
                        bajo: data.resumen_riesgo["Bajo Rendimiento"] || 0
                    };
                    const resumenRotacion = {
                        alto: data.resumen_rotacion["Alto Rendimiento"] || 0,
                        medio: data.resumen_rotacion["Medio Rendimiento"] || 0,
                        bajo: data.resumen_rotacion["Bajo Rendimiento"] || 0
                    };
                    const resumenDespido = {
                        alto: data.resumen_despido["Alto Rendimiento"] || 0,
                        medio: data.resumen_despido["Medio Rendimiento"] || 0,
                        bajo: data.resumen_despido["Bajo Rendimiento"] || 0
                    };
                    const resumenRenuncia = {
                        alto: data.resumen_renuncia["Alto Rendimiento"] || 0,
                        medio: data.resumen_renuncia["Medio Rendimiento"] || 0,
                        bajo: data.resumen_renuncia["Bajo Rendimiento"] || 0
                    };

                    setResumen({
                        rendimiento: resumenRendimiento,
                        rotacion: resumenRotacion,
                        despido: resumenDespido,
                        renuncia: resumenRenuncia
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

    const resumenToPieData = (res) => [
        { name: "Alto", value: res.alto, color: colors.alto },
        { name: "Medio", value: res.medio, color: colors.medio },
        { name: "Bajo", value: res.bajo, color: colors.bajo }
    ];

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h2 className="text-2xl font-bold mb-4 text-black">Riesgos y Rendimiento de Analistas</h2>

            {loading ? (
                <p className="text-center text-gray-500">Cargando datos...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-md mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-2 text-center">Distribución de Rendimiento Predicho</h3>
                            <p className="text-xs text-center text-gray-500 mb-2">
                                Muestra cuántos analistas tienen alto, medio o bajo rendimiento según el modelo.
                            </p>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={resumenToPieData(resumen.rendimiento)} dataKey="value" nameKey="name" outerRadius={80}>
                                        {resumenToPieData(resumen.rendimiento).map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-2 text-center">Riesgo de Rotación</h3>
                            <p className="text-xs text-center text-gray-500 mb-2">
                                Indica el riesgo de que los analistas roten de puesto o área.
                            </p>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={resumenToPieData(resumen.rotacion)} dataKey="value" nameKey="name" outerRadius={80}>
                                        {resumenToPieData(resumen.rotacion).map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-2 text-center">Riesgo de Despido</h3>
                            <p className="text-xs text-center text-gray-500 mb-2">
                                Indica el riesgo de que los analistas sean despedidos.
                            </p>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={resumenToPieData(resumen.despido)} dataKey="value" nameKey="name" outerRadius={80}>
                                        {resumenToPieData(resumen.despido).map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-2 text-center">Riesgo de Renuncia</h3>
                            <p className="text-xs text-center text-gray-500 mb-2">
                                Indica el riesgo de que los analistas renuncien voluntariamente.
                            </p>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={resumenToPieData(resumen.renuncia)} dataKey="value" nameKey="name" outerRadius={80}>
                                        {resumenToPieData(resumen.renuncia).map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-blue-100 p-4 rounded-lg shadow-md mt-6">
                        <h3 className="text-lg font-bold mb-2 text-black">Detalle de Analistas</h3>
                        <table className="w-full text-left border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-blue-200 text-black border border-gray-300">
                                    <th className="p-2 border border-gray-300">Nombre</th>
                                    <th className="p-2 border border-gray-300">Antigüedad</th>
                                    <th className="p-2 border border-gray-300">Capacitación</th>
                                    <th className="p-2 border border-gray-300">Ausencias</th>
                                    <th className="p-2 border border-gray-300">Tarde</th>
                                    <th className="p-2 border border-gray-300">Tempranas</th>
                                    <th className="p-2 border border-gray-300">Rendimiento</th>
                                    <th className="p-2 border border-gray-300">Rotación</th>
                                    <th className="p-2 border border-gray-300">Despido</th>
                                    <th className="p-2 border border-gray-300">Renuncia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empleados.map((emp, idx) => (
                                    <tr key={emp.id_usuario} className={`hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'} text-black`}>
                                        <td className="p-2 border border-gray-300">{emp.nombre}</td>
                                        <td className="p-2 border border-gray-300">{emp.antiguedad}</td>
                                        <td className="p-2 border border-gray-300">{emp.horas_capacitacion}</td>
                                        <td className="p-2 border border-gray-300">{emp.ausencias_injustificadas}</td>
                                        <td className="p-2 border border-gray-300">{emp.llegadas_tarde}</td>
                                        <td className="p-2 border border-gray-300">{emp.salidas_tempranas}</td>
                                        <td className="p-2 border border-gray-300">{emp.clasificacion_rendimiento}</td>
                                        <td className="p-2 border border-gray-300">{emp.riesgo_rotacion_predicho}</td>
                                        <td className="p-2 border border-gray-300">{emp.riesgo_despido_predicho}</td>
                                        <td className="p-2 border border-gray-300">{emp.riesgo_renuncia_predicho}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}