import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import AnalistaHome from "./pages/AnalistaHome";
import AdminHome from "./pages/AdminHome";
import CandidatoHome from "./pages/CandidatoHome";
import Lobby from "./pages/Lobby";
import Pagos from "./pages/Pagos"; 
import AdminEmpHome from "./pages/AdminEmpHome";
import ManagerHome from "./pages/ManagerHome";

import Productos from "./pages/Productos";
import Precios from "./pages/Precios";
import Clientes from "./pages/Clientes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/login" element={<Login />} />
        <Route path="/analista/home" element={<AnalistaHome />} />
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/candidato/home" element={<CandidatoHome />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/pagos" element={<Pagos />} /> 
        <Route path="/adminemp/home" element={<AdminEmpHome />} /> 
        <Route path="/manager/home" element={<ManagerHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
