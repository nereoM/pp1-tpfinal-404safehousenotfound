import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RrhhHome from "./pages/RrhhHome";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby"; // Asegurate de importar el componente

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} /> {/* Cambiado para que Lobby sea la página principal */}
        <Route path="/login" element={<Login />} />
        <Route path="/rrhh/home" element={<RrhhHome />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
