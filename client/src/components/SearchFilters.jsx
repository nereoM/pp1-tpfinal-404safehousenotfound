import { useState } from "react";

export function SearchFilters({ onBuscar }) {
    const [filtros, setFiltros] = useState({
      workplace_type: "",
      employment_type: "",
      salary_min: "",
      salary_max: "",
      experience_level: "",
      location: ""
    });
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFiltros((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleBuscar = () => {
      onBuscar(filtros);
    };
  
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4"> Filtros de búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="location"
            placeholder="Ubicación"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
          />
          <select
            name="workplace_type"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
          >
            <option value="">Tipo de lugar</option>
            <option value="remote">Remoto</option>
            <option value="onsite">Presencial</option>
            <option value="hybrid">Híbrido</option>
          </select>
          <select
            name="employment_type"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
          >
            <option value="">Tipo de empleo</option>
            <option value="full-time">Tiempo completo</option>
            <option value="part-time">Medio tiempo</option>
            <option value="freelance">Freelance</option>
          </select>
          <select
            name="experience_level"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
          >
            <option value="">Nivel de experiencia</option>
            <option value="junior">Junior</option>
            <option value="semi-senior">Semi-Senior</option>
            <option value="senior">Senior</option>
          </select>
          <input
            type="number"
            name="salary_min"
            placeholder="Salario mínimo"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
          />
          <input
            type="number"
            name="salary_max"
            placeholder="Salario máximo"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
          />
        </div>
        <button
          className="w-full mt-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          onClick={handleBuscar}
        >
          Buscar con filtros
        </button>
      </div>
    );
  }
  