import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({
    color_princ: "#0044cc",
    color_sec: "#e0e7ff",
    color_texto: "#1e1e1e",
    logo_url: "/logo-default.svg",
    slogan: "El mundo laboral no espera. Tampoco vos."
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/admin-emp/preferencias`, {
          credentials: "include",
        });
        const data = await res.json();
        console.log("🎨 Preferencias recibidas:", data); 
        setTheme((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("No se pudo cargar el tema:", err);
      }
    };
  
    fetchPreferences();
  }, []);
  



  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
