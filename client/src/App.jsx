import { BrowserRouter, Route, Routes } from "react-router-dom";

import AdminEmpHome from "./pages/AdminEmpHome";
import AdminHome from "./pages/AdminHome";
import CandidatoHome from "./pages/CandidatoHome";
import DomainLogin from "./pages/DominioEmpresa";
import EmpleadoHome from "./pages/EmpleadoHome";
import EmpleadosRendimiento from "./pages/EmpleadosRendimientoEmpleados";
import RendimientoAnalistas from './pages/EmpleadosRendimientosAnalistas';
import RiesgosAnalistasConTabla from "./pages/EmpleadosRiesgoAnalistas";
import EmpleadosRiesgo from "./pages/EmpleadosRiesgoEmpleados";
import Lobby from "./pages/Lobby";
import LobbyEmp from "./pages/LobbyEmp";
import Login from "./pages/Login";
import LoginEmpresa from "./pages/LoginEmpresa";
import ManagerHome from "./pages/ManagerHome";
import Pagos from "./pages/Pagos";
import ReclutadorHome from "./pages/ReclutadorHome";

import { ReclutadorLayout } from "./components/ReclutadorLayout";
import Clientes from "./pages/Clientes";
import NotificacionesPage from "./pages/Notificaciones";
import Precios from "./pages/Precios";
import Productos from "./pages/Productos";
import IchiChatBot from "./components/IchiBot";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/lobbyemp" element={<LobbyEmp />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="reclutador" element={<ReclutadorLayout />} />
        <Route path="/reclutador/home" element={<ReclutadorHome />} />
        <Route path="/empresa"element={<DomainLogin />} />
        <Route path="/loginempresa" element={<LoginEmpresa />} />
        <Route path="/login/:nombre_empresa" element={<LoginEmpresa />} />
        <Route path="/manager/empleados-rendimiento-analistas" element={<RendimientoAnalistas />} />
        <Route path="/manager/analistas-riesgo" element={<RiesgosAnalistasConTabla />} />

        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/empleado/home" element={<EmpleadoHome />} />
        <Route path="/candidato/home" element={<CandidatoHome />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/pagos" element={<Pagos />} />
        <Route path="/adminemp/home" element={<AdminEmpHome />} />
        <Route path="/manager/home" element={<ManagerHome />} />
        <Route path="/reclutador/empleados-rendimiento" element={<EmpleadosRendimiento />} />
        <Route path="/reclutador/empleados-riesgo" element={<EmpleadosRiesgo />} />
        <Route path="/notificaciones" element={<NotificacionesPage />} />
      </Routes>

      {/* IchiBot global en todas las páginas */}
      <IchiChatBot estado="neutral" />
    </BrowserRouter>
  );
}

export default App;
