import { BrowserRouter, Route, Routes } from "react-router-dom";

import AdminEmpHome from "./pages/AdminEmpHome";
import AdminHome from "./pages/AdminHome";
import ReclutadorHome from "./pages/ReclutadorHome";
import CandidatoEmpHome from "./pages/CandidatoEmpHome";
import CandidatoHome from "./pages/CandidatoHome";
import Lobby from "./pages/Lobby";
import Login from "./pages/Login";
import ManagerHome from "./pages/ManagerHome";
import Pagos from "./pages/Pagos";

import { ReclutadorLayout } from "./components/ReclutadorLayout";
import Clientes from "./pages/Clientes";
import Precios from "./pages/Precios";
import Productos from "./pages/Productos";
import LicenciasManager from "./pages/LicenciasManager";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/login" element={<Login />} />
        <Route path="reclutador" element={<ReclutadorLayout />}>
        <Route path="/reclutador/home" element={<ReclutadorHome />} />
        </Route>
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/candidatoemp/home" element={<CandidatoEmpHome />} />
        <Route path="/candidato/home" element={<CandidatoHome />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/pagos" element={<Pagos />} /> 
        <Route path="/adminemp/home" element={<AdminEmpHome />} /> 
        <Route path="/manager/home" element={<ManagerHome />} />
        <Route path="/manager/licencias" element={<LicenciasManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
