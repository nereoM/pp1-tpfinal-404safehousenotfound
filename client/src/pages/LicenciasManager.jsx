import { useEffect, useState } from "react";

const LicenciasManager = () => {
    const [licencias, setLicencias] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        const obtenerLicencias = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/visualizar-licencias-solicitadas`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await res.json();
                if (res.ok) {
                    setLicencias(data);
                } else {
                    throw new Error(data.error || data.message);
                }
            } catch (error) {
                console.error("Error al obtener las licencias:", error);
                setMensaje("Error al cargar las licencias.");
            }
        };

        obtenerLicencias();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-center mb-6">Licencias del Personal</h1>

            {mensaje && (
                <div className="mb-4 text-center text-green-700 font-semibold">
                    {mensaje}
                </div>
            )}

            {licencias.length === 0 ? (
                <p className="text-center text-lg text-gray-500">No hay licencias solicitadas.</p>
            ) : (
                <table className="min-w-full table-auto border-collapse">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left border-b">Empleado</th>
                            <th className="px-4 py-2 text-left border-b">Tipo</th>
                            <th className="px-4 py-2 text-left border-b">Estado</th>
                            <th className="px-4 py-2 text-left border-b">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {licencias.map((item) => {
                            const licencia = item.licencia;
                            return (
                                <tr key={licencia.id_licencia}>
                                    <td>{licencia.empleado?.nombre ?? "Sin nombre"} {licencia.empleado?.apellido ?? ""}</td>
                                    <td>{licencia.tipo}</td>
                                    <td>{licencia.descripcion}</td>
                                    <td>{licencia.fecha_inicio}</td>
                                    <td>{licencia.estado}</td>
                                    <td>{licencia.empresa?.nombre ?? "Sin empresa"}</td>
                                    <td>
                                        {licencia.certificado_url ? (
                                            <a
                                                href={licencia.certificado_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline mr-2"
                                            >
                                                Certificado
                                            </a>
                                        ) : (
                                            "Sin certificado"
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default LicenciasManager;
