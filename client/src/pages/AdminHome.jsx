import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { Users, Settings, BarChart2, FileText, UserPlus } from "lucide-react";

export default function AdminRootHome() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", lastname: "", username: "", email: "", company_name: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [generatedPassword, setGeneratedPassword] = useState(""); 
    const navigate = useNavigate();

    // Validar email
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Carga del usuario autenticado
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

    // Obtener mensaje de bienvenida desde el backend
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/admin-404-home`, { credentials: "include" })
            .then(res => {
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
                return res.json();
            })
            .then(data => console.log(data.message))
            .catch(err => console.error("Error al obtener mensaje de bienvenida:", err));
    }, []);

    // Función para registrar un nuevo administrador de empresa
    const registrarAdminEmp = async () => {
        setMessage("");
        setError("");
        setGeneratedPassword("");

        // Validaciones
        if (!formData.name || formData.name.length < 4) {
            setError("El nombre debe tener al menos 4 caracteres.");
            return;
        }
        if (!formData.lastname || formData.lastname.length < 4) {
            setError("El apellido debe tener al menos 4 caracteres.");
            return;
        }
        if (!formData.username || formData.username.length < 4) {
            setError("El nombre de usuario debe tener al menos 4 caracteres.");
            return;
        }
        if (!isValidEmail(formData.email)) {
            setError("El email no es válido.");
            return;
        }
        if (!formData.company_name || formData.company_name.length < 4) {
            setError("El nombre de la empresa debe tener al menos 4 caracteres.");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/registrar-admin-emp`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || `Error del servidor: ${response.status}`);
                return;
            }

            const data = await response.json();
            setMessage(data.message);
            setGeneratedPassword(data.credentials.password); // Mostrar la contraseña generada
            setFormData({ name: "", lastname: "", username: "", email: "", company_name: "" });
        } catch (err) {
            console.error("Error al registrar administrador:", err);
            setError("Ocurrió un error al procesar la solicitud.");
        }
    };

    // Función de logout
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

    if (loadingUser) {
        return <div className="p-10 text-center">Cargando usuario…</div>;
    }

    if (!user) {
        return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;
    }

    const estilosSafe = {
        color_principal: "#2563eb",
        color_secundario: "#f3f4f6",
        color_texto: "#000000",
        slogan: "Bienvenido al panel de Administración Root",
    };

    const acciones = [
        {
            icon: Users,
            titulo: "Gestionar Empresas",
            descripcion: "Visualiza y administra todas las empresas registradas.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
        {
            icon: UserPlus,
            titulo: "Registrar Admin Empresa",
            descripcion: "Registra un nuevo administrador de empresa.",
            onClick: () => setModalOpen(true),
        },
        {
            icon: BarChart2,
            titulo: "Generar Reportes Globales",
            descripcion: "Genera reportes sobre el sistema global de usuarios y empresas.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
        {
            icon: FileText,
            titulo: "Ver Solicitudes del Sistema",
            descripcion: "Revisa las solicitudes funcionales y no funcionales del sistema.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
        {
            icon: Settings,
            titulo: "Configurar Sistema",
            descripcion: "Ajustes generales y configuración del sistema.",
            onClick: () => alert("Funcionalidad en desarrollo"),
        },
    ];

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
                            <h2 className="text-lg font-semibold text-black">Acciones disponibles</h2>
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

                    {/* Modal para registrar Admin Empresa */}
                    {modalOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4">
                                <h2 className="text-lg font-semibold" style={{ color: "#000" }}>
                                    Registrar Admin Empresa
                                </h2>

                                {message && (
                                    <div className="rounded p-2 text-sm text-green-700 bg-green-100">
                                        {message}
                                        {generatedPassword && (
                                            <p className="mt-2 text-sm text-gray-800">
                                                Contraseña generada: <strong>{generatedPassword}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <div className="rounded p-2 text-sm text-red-700 bg-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium" style={{ color: "#000" }}>
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        style={{ color: "#000" }}
                                    />

                                    <label className="text-sm font-medium" style={{ color: "#000" }}>
                                        Apellido
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Apellido"
                                        value={formData.lastname}
                                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        style={{ color: "#000" }}
                                    />

                                    <label className="text-sm font-medium" style={{ color: "#000" }}>
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        style={{ color: "#000" }}
                                    />

                                    <label className="text-sm font-medium" style={{ color: "#000" }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        style={{ color: "#000" }}
                                    />

                                    <label className="text-sm font-medium" style={{ color: "#000" }}>
                                        Nombre de la Empresa
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre de la Empresa"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        style={{ color: "#000" }}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={registrarAdminEmp}
                                        className="px-4 py-2 text-white rounded"
                                        style={{ backgroundColor: estilosSafe.color_principal }}
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