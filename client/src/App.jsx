import { BrowserRouter, Route, Routes } from "react-router-dom";

import AdminEmpHome from "./pages/AdminEmpHome";
import AdminHome from "./pages/AdminHome";
import AnalistaHome from "./pages/AnalistaHome";
import CandidatoHome from "./pages/CandidatoHome";
import Lobby from "./pages/Lobby";
import Login from "./pages/Login";
import ManagerHome from "./pages/ManagerHome";
import Pagos from "./pages/Pagos";

import { AnalistaOfertas } from "./pages/AnalistaOfertas";
import Clientes from "./pages/Clientes";
import Precios from "./pages/Precios";
import Productos from "./pages/Productos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/login" element={<Login />} />
        <Route path="/analista/home" element={<AnalistaHome />} />
        <Route path="/analista/ofertas" element={<AnalistaOfertas />} />
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
