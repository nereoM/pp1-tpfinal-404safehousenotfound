import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function RendimientoAnalistas() {
  const [empleados, setEmpleados] = useState([]);
  const [resumen, setResumen] = useState({ alto: 0, medio: 0, bajo: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generarMockEmpleados = (N) => {
      return Array.from({ length: N }, (_, i) => {
        const prev = Number((Math.random() * 10).toFixed(2));
        const futuro = Number((prev + Math.random() * 2 - 1).toFixed(2));
        let clas = 'Bajo Rendimiento';
        if (futuro >= 7.5) clas = 'Alto Rendimiento';
        else if (futuro >= 5) clas = 'Medio Rendimiento';
        return {
          id_usuario: i + 1,
          nombre: `Empleado ${i + 1}`,
          desempeno_previo: prev,
          cantidad_proyectos: Math.ceil(Math.random() * 10),
          tamano_equipo: Math.ceil(Math.random() * 5),
          horas_extras: Math.floor(Math.random() * 20),
          antiguedad: `${Math.ceil(Math.random() * 5)} años`,
          horas_capacitacion: Math.floor(Math.random() * 15),
          rendimiento_futuro_predicho: futuro,
          clasificacion: clas,
        };
      });
    };

    const datos = generarMockEmpleados(30);

    setEmpleados(datos);

    setResumen({
      alto: datos.filter((e) => e.clasificacion === 'Alto Rendimiento').length,
      medio: datos.filter((e) => e.clasificacion === 'Medio Rendimiento').length,
      bajo: datos.filter((e) => e.clasificacion === 'Bajo Rendimiento').length,
    });

    setLoading(false);
  }, []);


  const rendimientoColors = {
    'Alto Rendimiento': '#A7F3D0',
    'Medio Rendimiento': '#FDE68A',
    'Bajo Rendimiento': '#FECACA',
  };

  const resumenData = [
    { name: 'Alto Rendimiento', value: resumen.alto },
    { name: 'Medio Rendimiento', value: resumen.medio },
    { name: 'Bajo Rendimiento', value: resumen.bajo },
  ];

  const resumenGeneral = [
    {
      name: 'Alto Rendimiento',
      promedio: (
        empleados
          .filter((e) => e.clasificacion === 'Alto Rendimiento')
          .reduce((acc, curr) => acc + curr.rendimiento_futuro_predicho, 0) /
        empleados.filter((e) => e.clasificacion === 'Alto Rendimiento').length || 0
      ).toFixed(2),
    },
    {
      name: 'Medio Rendimiento',
      promedio: (
        empleados
          .filter((e) => e.clasificacion === 'Medio Rendimiento')
          .reduce((acc, curr) => acc + curr.rendimiento_futuro_predicho, 0) /
        empleados.filter((e) => e.clasificacion === 'Medio Rendimiento').length || 0
      ).toFixed(2),
    },
    {
      name: 'Bajo Rendimiento',
      promedio: (
        empleados
          .filter((e) => e.clasificacion === 'Bajo Rendimiento')
          .reduce((acc, curr) => acc + curr.rendimiento_futuro_predicho, 0) /
        empleados.filter((e) => e.clasificacion === 'Bajo Rendimiento').length || 0
      ).toFixed(2),
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-black">Rendimiento Futuro de Analistas</h2>

      {loading ? (
        <p className="text-center text-gray-500">Cargando datos...</p>
      ) : (
        <>
          
          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-md mb-6">
            
            {/* Gráfico de Torta */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-2 text-center">Resumen de Rendimiento</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={resumenData} dataKey="value" nameKey="name" outerRadius={100}>
                    {resumenData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={rendimientoColors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* grafico de Barras */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-2 text-center">Promedio por Clasificación</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resumenGeneral}>
                  <XAxis dataKey="name" stroke="#000" />
                  <YAxis stroke="#000" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="promedio" name="Rendimiento Promedio" fill="#60A5FA">
                    <Cell fill="#A7F3D0" />
                    <Cell fill="#FDE68A" />
                    <Cell fill="#FECACA" />
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
                    <td className="p-2 border border-gray-300">{emp.rendimiento_futuro_predicho.toFixed(2)}</td>
                    <td className="p-2 border border-gray-300">{emp.clasificacion}</td>
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
