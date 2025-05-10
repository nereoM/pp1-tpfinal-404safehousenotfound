import { useState } from "react";
import { useOfertasContext } from "../context/OfertasContext";

export function SearchFilters({ onBuscar }) {
  const { handlerAplicarFiltros } = useOfertasContext()

    const [filtros, setFiltros] = useState({
      workplaceType: "",
      employmentType: "",
      salaryMin: "",
      salaryMax: "",
      experienceLevel: "",
      location: ""
    });
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFiltros((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleBuscar = () => {
      handlerAplicarFiltros(filtros)
      onBuscar();
    };
  
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4"> Filtros de búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="location"
            placeholder="Ubicación"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onChange={handleChange}
          />
          <select
            name="workplaceType"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onChange={handleChange}
          >
            <option value="">Tipo de lugar</option>
            <option value="remote">Remoto</option>
            <option value="onsite">Presencial</option>
            <option value="hybrid">Híbrido</option>
          </select>
          <select
            name="employmentType"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onChange={handleChange}
          >
            <option value="">Tipo de empleo</option>
            <option value="full-time">Tiempo completo</option>
            <option value="part-time">Medio tiempo</option>
            <option value="freelance">Freelance</option>
          </select>
          <select
            name="experienceLevel"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onChange={handleChange}
          >
            <option value="">Nivel de experiencia</option>
            <option value="junior">Junior</option>
            <option value="semi-senior">Semi-Senior</option>
            <option value="senior">Senior</option>
          </select>
          <input
            type="number"
            name="salaryMin"
            placeholder="Salario mínimo"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onChange={handleChange}
          />
          <input
            type="number"
            name="salaryMax"
            placeholder="Salario máximo"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onChange={handleChange}
          />
        </div>
        <button
          className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
          onClick={handleBuscar}
        >
          Buscar con filtros
        </button>
      </div>
    );
  }
  