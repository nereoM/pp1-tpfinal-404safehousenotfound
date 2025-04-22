import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="text-4xl font-bold">React with Vite + Python with Flask</div>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App;