import { useState } from "react";

const EMPLOYMENT_TYPES  = ["Full-Time", "Part-Time", "Medio tiempo"];
const WORKPLACE_TYPES   = ["Remoto", "Presencial", "Híbrido"];
const EXPERIENCE_LEVELS = ["Sin experiencia", "Junior", "Semi Senior", "Senior"];

export function SearchFilters({ onBuscar }) {
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
      onBuscar(filtros);
    };
  
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4"> Filtros de búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="location"
            value={filtros.location}
            placeholder="Ubicación"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onChange={handleChange}
          />

          <select
            name="workplaceType"
            value={filtros.workplaceType}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Tipo de lugar</option>
            {WORKPLACE_TYPES.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
          name="employmentType"
          value={filtros.employmentType}
          onChange={handleChange}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">Tipo de empleo</option>
          {EMPLOYMENT_TYPES.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

            <select
              name="experienceLevel"
              value={filtros.experienceLevel}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Nivel de experiencia</option>
              {EXPERIENCE_LEVELS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
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
  