import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RrhhHome from "./pages/RrhhHome";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/rrhh/home" element={<RrhhHome />} />
      </Routes>
    </Router>
  );
}