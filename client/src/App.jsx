import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RrhhHome from "./pages/RrhhHome";
import AdminHome from "./pages/AdminHome";
import CandidatoHome from "./pages/CandidatoHome";
import Lobby from "./pages/Lobby";

import Productos from "./pages/Productos";
import Precios from "./pages/Precios";
import Clientes from "./pages/Clientes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/login" element={<Login />} />
        <Route path="/rrhh/home" element={<RrhhHome />} />
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/candidato/home" element={<CandidatoHome />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/clientes" element={<Clientes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
