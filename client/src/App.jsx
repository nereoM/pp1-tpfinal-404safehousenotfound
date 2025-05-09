import { BrowserRouter, Route, Routes } from "react-router-dom";

import AdminEmpHome from "./pages/AdminEmpHome";
import AdminHome from "./pages/AdminHome";
import CandidatoHome from "./pages/CandidatoHome";
import EmpleadoHome from "./pages/EmpleadoHome";
import Lobby from "./pages/Lobby";
import LobbyEmp from "./pages/LobbyEmp";
import Login from "./pages/Login";
import ManagerHome from "./pages/ManagerHome";
import Pagos from "./pages/Pagos";
import ReclutadorHome from "./pages/ReclutadorHome";

import { ReclutadorLayout } from "./components/ReclutadorLayout";
import Clientes from "./pages/Clientes";
import Precios from "./pages/Precios";
import Productos from "./pages/Productos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/lobbyemp" element={<LobbyEmp />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="reclutador" element={<ReclutadorLayout />} />
        <Route path="/reclutador/home" element={<ReclutadorHome />} />
        
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/empleado/home" element={<EmpleadoHome />} />
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
