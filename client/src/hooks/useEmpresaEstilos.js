import { useState, useEffect } from "react";

export function useEmpresaEstilos(idEmpresa) {
  const [estilos, setEstilos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstilos = async () => {
      console.log("🔗 API_URL:", import.meta.env.VITE_API_URL);
      console.log("🏭 idEmpresa:", idEmpresa);

      setLoading(true);
      try {
        if (!idEmpresa) {
          setEstilos({});
          return;
        }

        // <-- Volvemos a apuntar al /api/empresa/... 
        const url = `${import.meta.env.VITE_API_URL}/api/empresa/${idEmpresa}/preferencias`;
        const res = await fetch(url, { credentials: "include" });

        if (res.status === 404) {
          console.warn(`⚠️ No hay prefs para empresa ${idEmpresa} (404)`);
          setEstilos({});
          return;
        }

        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        console.log("🎨 estilos recibidos:", data);
        setEstilos(data);
      } catch (err) {
        console.error("❌ Error cargando estilos:", err);
        setEstilos({});
      } finally {
        setLoading(false);
      }
    };

    fetchEstilos();
  }, [idEmpresa]);

  return { estilos, loading };
}
