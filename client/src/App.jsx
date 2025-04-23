import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RrhhHome from "./pages/RrhhHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/rrhh/home" element={<RrhhHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
