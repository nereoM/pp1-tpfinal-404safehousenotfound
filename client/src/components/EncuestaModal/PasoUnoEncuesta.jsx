// components/EncuestaModal/PasoUnoEncuesta.jsx

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";

export default function PasoUnoEncuesta({ formData, setFormData, onNext, onCancel }) {
  const [showInicio, setShowInicio] = useState(false);
  const [showFin, setShowFin] = useState(false);

  const handleChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor });
  };

  const handleChangeFecha = (campo, fecha) => {
    setFormData({
      ...formData,
      fechas: { ...formData.fechas, [campo]: fecha },
    });
  };

  const formatFecha = (fecha) =>
    fecha ? format(fecha, "dd/MM/yyyy", { locale: es }) : "";

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              n === 1 ? "bg-blue-500 text-white" : "bg-white text-black"
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      {/* Tipo */}
      <label className="block text-sm font-medium text-black">Tipo</label>
      <select
        value={formData.tipo || ""}
        onChange={(e) => handleChange("tipo", e.target.value)}
        className="w-full border p-2 rounded text-black bg-white"
      >
        <option value="" disabled>Seleccionar tipo</option>
        <option value="clima">Clima Laboral</option>
        <option value="uso">Uso de la Plataforma</option>
        <option value="desempeño">Desempeño</option>
        <option value="capacitacion">Capacitación y Desarrollo</option>
        <option value="diversidad">Diversidad e Inclusión</option>
        <option value="otro">Otro</option>
      </select>

      {/* Título */}
      <label className="block text-sm font-medium text-black">Título</label>
      <input
        type="text"
        value={formData.titulo || ""}
        onChange={(e) => handleChange("titulo", e.target.value)}
        className="w-full border p-2 rounded text-black"
        placeholder="Ej: Evaluación semestral"
      />

      {/* Descripción */}
      <label className="block text-sm font-medium text-black">Descripción</label>
      <textarea
        value={formData.descripcion || ""}
        onChange={(e) => handleChange("descripcion", e.target.value)}
        className="w-full border p-2 rounded text-black"
        placeholder="Objetivo general de la encuesta"
      />

      {/* ¿Anónima? */}
      <label className="block text-sm font-medium text-black">¿Anónima?</label>
      <div className="flex gap-4">
        {['si', 'no'].map((opcion) => (
          <label
            key={opcion}
            className={`flex items-center gap-2 px-4 py-1 border rounded cursor-pointer transition-colors ${
              formData.anonima === opcion
                ? 'bg-blue-500 text-white'
                : 'bg-white text-blue-500 border-blue-500 hover:bg-blue-100'
            }`}
          >
            <input
              type="radio"
              value={opcion}
              checked={formData.anonima === opcion}
              onChange={() => handleChange("anonima", opcion)}
              className="hidden"
            />
            {opcion.toUpperCase()}
          </label>
        ))}
      </div>

      {/* Fechas */}
      <label className="block text-sm font-medium text-black">Rango de fechas</label>
      <div className="border rounded p-2 bg-white shadow-md max-w-md">
        <DayPicker
          mode="range"
          selected={formData.fechas || { from: undefined, to: undefined }}
          onSelect={(range) => handleChange("fechas", range)}
          numberOfMonths={1}
          className="mx-auto text-black"
          styles={{
            caption: { color: "#1f2937" },
            head_cell: { color: "#374151", fontWeight: "500" },
            day_selected: { backgroundColor: "#2563eb", color: "white" },
            day: { color: "#111827" },
          }}
          showOutsideDays
          locale={es}
          disabled={{ before: new Date() }}
        />
        {formData.fechas?.from && (
          <p className="text-sm text-gray-600 mt-2">
            Seleccionado: {formatFecha(formData.fechas.from)}
            {formData.fechas.to
              ? ` hasta ${formatFecha(formData.fechas.to)}`
              : " (solo fecha de inicio)"}
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
        >
          Cancelar
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}