import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function RendimientoAnalistas() {
  const [empleados, setEmpleados] = useState([]);
  const [resumen, setResumen] = useState({ alto: 0, medio: 0, bajo: 0 });
  const [loading, setLoading] = useState(true);

  const rendimientoColors = {
    'Alto Rendimiento': '#A7F3D0',   // Verde
    'Medio Rendimiento': '#FDE68A',  // Amarillo
    'Bajo Rendimiento': '#FECACA'    // Rojo
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/empleados-rendimiento-analistas`, {
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

  const resumenData = [
    { name: 'Alto Rendimiento', value: parseFloat(resumen.alto), color: rendimientoColors['Alto Rendimiento'] },
    { name: 'Medio Rendimiento', value: parseFloat(resumen.medio), color: rendimientoColors['Medio Rendimiento'] },
    { name: 'Bajo Rendimiento', value: parseFloat(resumen.bajo), color: rendimientoColors['Bajo Rendimiento'] }
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-black">Rendimiento Futuro de Analistas</h2>

      {loading ? (
        <p className="text-center text-gray-500">Cargando datos...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-2 text-center">Resumen de Rendimiento</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={resumenData} dataKey="value" nameKey="name" outerRadius={100}>
                    {resumenData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-2 text-center">Promedio por Clasificación</h3>
              <p className="text-center text-blue-600 mb-2 font-semibold">Promedios de rendimientos</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resumenData}>
                  <XAxis dataKey="name" stroke="#000" />
                  <YAxis stroke="#000" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Promedio">
                    {resumenData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-blue-100 p-4 rounded-lg shadow-md mt-6">
            <h3 className="text-lg font-bold mb-2 text-black">Detalle de Empleados</h3>
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-200 text-black border border-gray-300">
                  <th className="p-2 border border-gray-300">Nombre</th>
                  <th className="p-2 border border-gray-300">Previo</th>
                  <th className="p-2 border border-gray-300">Proyectos</th>
                  <th className="p-2 border border-gray-300">Equipo</th>
                  <th className="p-2 border border-gray-300">Extras</th>
                  <th className="p-2 border border-gray-300">Antigüedad</th>
                  <th className="p-2 border border-gray-300">Capacitación</th>
                  <th className="p-2 border border-gray-300">Predicción</th>
                  <th className="p-2 border border-gray-300">Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((emp, index) => (
                  <tr key={emp.id_usuario} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'} text-black`}>
                    <td className="p-2 border border-gray-300">{emp.nombre}</td>
                    <td className="p-2 border border-gray-300">{emp.desempeno_previo}</td>
                    <td className="p-2 border border-gray-300">{emp.cantidad_proyectos}</td>
                    <td className="p-2 border border-gray-300">{emp.tamano_equipo}</td>
                    <td className="p-2 border border-gray-300">{emp.horas_extras}</td>
                    <td className="p-2 border border-gray-300">{emp.antiguedad}</td>
                    <td className="p-2 border border-gray-300">{emp.horas_capacitacion}</td>
                    <td className="p-2 border border-gray-300">{emp.rendimiento_futuro_predicho !== undefined && emp.rendimiento_futuro_predicho !== null ? emp.rendimiento_futuro_predicho.toFixed(2) : '-'}</td>
                    <td className="p-2 border border-gray-300">{emp.clasificacion_rendimiento}</td>
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
