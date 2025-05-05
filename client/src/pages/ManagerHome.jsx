import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { Users, PlusCircle, BarChart, FileText, RotateCcw, FileLock } from 'lucide-react';

export default function ManagerHome() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [formData, setFormData] = useState({ nombre: "", apellido: "", username: "", email: "" });
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/auth/me`, { credentials: "include" })
            .then(res => {
                if (!res.ok) throw new Error("Error al autenticar");
                return res.json();
            })
            .then(data => setUser(data))
            .catch(err => console.error("Error al obtener usuario:", err))
            .finally(() => setLoadingUser(false));
    }, []);

    const estilosSafe = {
        color_principal: "#2563eb",
        color_secundario: "#f3f4f6",
        color_texto: "#000000",
        slogan: "Bienvenido al panel de administración de Manager",
    };

    const acciones = [
        {
            icon: Users,
            titulo: "Ver Listado de Ofertas",
            descripcion: "Accede al listado de ofertas disponibles en el sistema.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
        {
            icon: PlusCircle,
            titulo: "Publicar una Nueva Oferta",
            descripcion: "Crea y publica nuevas ofertas en el sistema.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
        {
            icon: BarChart,
            titulo: "Crear Analista",
            descripcion: "Registrá nuevos analistas para tu empresa.",
            onClick: () => setModalOpen(true),
        },
        {
            icon: RotateCcw,
            titulo: "Ver Análisis de Rotación",
            descripcion: "Consulta los indicadores relacionados con la rotación de personal.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
        {
            icon: FileLock,
            titulo: "Consultar Licencias",
            descripcion: "Accede a las licencias del personal y sus estados.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
        {
            icon: FileText,
            titulo: "Ver Reportes",
            descripcion: "Revisa los informes y reportes detallados del sistema.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
    ];

    const handleLogout = () => {
        fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
        })
            .then(res => {
                if (!res.ok) throw new Error("Error al cerrar sesión");
                navigate("/login");
            })
            .catch(err => console.error("Error al cerrar sesión:", err));
    };

    const crearAnalista = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrar-reclutador`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.nombre,
                    lastname: formData.apellido,
                    username: formData.username,
                    email: formData.email
                })
            });

            const data = await res.json();
            if (res.ok) {
                setMensaje(`Analista creado correctamente.\nUsuario: ${data.credentials.username}\nPassword temporal: ${data.credentials.password}`);
                setFormData({ nombre: "", apellido: "", username: "", email: "" });
            } else {
                setMensaje(`Error: ${data.error}`);
            }
        } catch (err) {
            setMensaje("Error al conectar con el servidor");
        }
    };

    if (loadingUser) {
        return <div className="p-10 text-center">Cargando usuario…</div>;
    }

    if (!user) {
        return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;
    }

    return (
        <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <PageLayout>
                    <TopBar
                        username={`${user.nombre} ${user.apellido}`}
                        onLogout={handleLogout}
                        style={{ backgroundColor: estilosSafe.color_principal }}
                    />

                    <div className="px-4 py-6">
                        <div
                            className="mx-auto w-fit text-sm font-medium px-4 py-2 rounded-full border shadow-sm"
                            style={{
                                backgroundColor: estilosSafe.color_secundario,
                                borderColor: estilosSafe.color_principal,
                                color: estilosSafe.color_texto,
                            }}
                        >
                            {estilosSafe.slogan}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="relative"
                        >
                            <ProfileCard
                                nombre={`${user?.nombre} ${user?.apellido}`}
                                correo={user?.correo}
                                fotoUrl="https://i.postimg.cc/3x2SrWdX/360-F-64676383-Ldbmhi-NM6-Ypzb3-FM4-PPu-FP9r-He7ri8-Ju.webp"
                                showCvLink={false}
                                size="xl"
                                style={{ borderColor: estilosSafe.color_principal }}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="md:col-span-2 space-y-4"
                        >
                            <h2 className="text-lg font-semibold">Acciones disponibles</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {acciones.map(({ icon: Icon, titulo, descripcion, onClick }, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.4 }}
                                        onClick={onClick}
                                        className="cursor-pointer border p-5 rounded-xl shadow-sm hover:shadow-md"
                                        style={{
                                            backgroundColor: estilosSafe.color_secundario,
                                            borderColor: estilosSafe.color_secundario,
                                            color: estilosSafe.color_texto,
                                        }}
                                    >
                                        <Icon className="w-6 h-6 mb-2" style={{ color: estilosSafe.color_texto }} />
                                        <h3 className="text-base font-semibold">{titulo}</h3>
                                        <p className="text-sm mt-1">{descripcion}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {modalOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4">
                                <h2 className="text-lg font-semibold text-black">Nuevo Analista</h2>

                                {mensaje && (
                                    <div className="rounded p-2 text-sm text-left whitespace-pre-wrap bg-blue-100 text-black">
                                        {mensaje}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {["nombre", "apellido", "username", "email"].map((campo) => (
                                        <div key={campo}>
                                            <label className="text-sm font-medium text-black capitalize">{campo}</label>
                                            <input
                                                type={campo === "email" ? "email" : "text"}
                                                placeholder={campo}
                                                value={formData[campo]}
                                                onChange={(e) => setFormData({ ...formData, [campo]: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded text-black"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
                                    <button
                                        onClick={crearAnalista}
                                        className="px-4 py-2 text-white rounded bg-blue-600"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </PageLayout>
            </motion.div>
        </EstiloEmpresaContext.Provider>
    );
}
