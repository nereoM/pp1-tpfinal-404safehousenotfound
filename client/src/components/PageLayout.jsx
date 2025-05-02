import { useTheme } from "./ThemeContext";



export default function PageLayout({ children }) {
  const { theme } = useTheme();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: theme.color_sec }}
    >
      {children}
    </main>
  );
}
