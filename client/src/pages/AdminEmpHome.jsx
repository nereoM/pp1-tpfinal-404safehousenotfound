import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useEmpresaEstilos } from "../hooks/useEmpresaEstilos";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";
import PageLayout from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ProfileCard } from "../components/ProfileCard";
import { JobCard } from "../components/JobCard";

export default function AdminEmpHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Carga de usuario autenticado
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, { credentials: "include" });
        if (!res.ok) throw new Error("Error al autenticar");
        const data = await res.json();
        console.log("✅ Usuario cargado:", data);
        setUser(data);
      } catch (err) {
        console.error("❌ Error al obtener usuario:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  // Determinar ID de empresa (fallback a user.id)
    // Add override for testing company ID
  const [overrideEmpresaId, setOverrideEmpresaId] = useState(null);
  // Determine which company ID to use: override or user.id_empresa
  const empresaId = overrideEmpresaId ?? user?.id_empresa;
  if (overrideEmpresaId !== null) {
    console.log(`🔧 Usando overrideEmpresaId: ${overrideEmpresaId}`);
  } else if (user && !user.id_empresa) {
    console.warn(
      `⚠️ user.id_empresa indefinido, overrideEmpresaId vacío; preferencias no se cargarán hasta definir ID.`
    );
  }
  console.log("🏭 ID de empresa para estilos:", empresaId);
  if (user && !user.id_empresa) {
    console.warn(
      `⚠️ user.id_empresa indefinido, usando user.id (${user.id}) como empresaId fallback.`
    );
  }
  console.log("🏭 ID de empresa para estilos:", empresaId);

  // Uso del hook de estilos SIEMPRE, manteniendo el orden de Hooks
  const { estilos, loading: loadingEstilos } = useEmpresaEstilos(empresaId);

  // Estados de carga
  if (loadingUser) {
    return <div className="p-10 text-center">Cargando usuario…</div>;
  }
  if (!user) {
    return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;
  }
  if (loadingEstilos) {
    return <div className="p-10 text-center">Cargando preferencias de empresa…</div>;
  }

  // Valores por defecto + merge con estilos obtenidos
  const estilosSafe = {
    color_principal: estilos?.color_principal ?? "#2563eb",
    color_secundario: estilos?.color_secundario ?? "#f3f4f6",
    color_texto: estilos?.color_texto ?? "#000000",
    slogan: estilos?.slogan ?? "Bienvenido",
  };

  return (
    <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <PageLayout>
          {/* Override para probar diferentes empresas si user.id_empresa es indefinido */}
          {user && user.id_empresa == null && (
            <div className="px-4 py-4 bg-white/10 backdrop-blur-xl rounded mb-4 text-center">
              <label className="text-white mr-2">ID Empresa (test):</label>
              <input
                type="number"
                placeholder="Ej: 12"
                value={overrideEmpresaId ?? ''}
                onChange={(e) => setOverrideEmpresaId(e.target.value ? parseInt(e.target.value) : null)}
                className="p-1 rounded text-black"
              />
            </div>
          )}
          <TopBar
            username={user.username}
            onLogout={() => {
              // TODO: manejar logout
            }}
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
              className="relative"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ProfileCard
                nombre={user.username}
                correo={user.correo}
                fotoUrl={user.fotoUrl}
                style={{ borderColor: estilosSafe.color_principal }}
              />
            </motion.div>

            <motion.div
              className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* Aquí mapear tus ofertas con JobCard */}
            </motion.div>
          </div>
        </PageLayout>
      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}


