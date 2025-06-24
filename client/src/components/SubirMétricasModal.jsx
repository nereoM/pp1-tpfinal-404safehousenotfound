import { ArrowUpRight, FileCheck, UploadCloud, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from "react";
import { DialogFooter } from './shadcn/Dialog';


export function SubirMetricasModal({ onClose, showToast }) {
  const inputMetricasRef = useRef(null);
  const [mensajeMetricas, setMensajeMetricas] = useState("");
  const [file, setFile] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [periodos, setPeriodos] = useState([]);
  // Estado de carga para el botón de subir métricas
  const [subiendoMetricas, setSubiendoMetricas] = useState(false);

  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/listar-periodos`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (Array.isArray(data.periodos)) setPeriodos(data.periodos);
        else if (Array.isArray(data)) setPeriodos(data);
      } catch (err) {
        console.error({ err });
        setPeriodos([]);
      }
    };
    fetchPeriodos();
  }, []);

  const subirMetricasDesdeCSV = async () => {
    if (!file) {
      showToast("Selecciona un archivo CSV.", "error");
      return;
    }
    if (!periodoSeleccionado) {
      showToast("Selecciona un periodo.", "error");
      return;
    }
    setSubiendoMetricas(true);
    showToast("Subiendo archivo...", "success");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/subir-info-laboral-analistas?id_periodo=${periodoSeleccionado}`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Archivo subido correctamente.", "success");
        setFile(null)
      } else {
        showToast(data.error || "Error al subir el archivo.", "error");
      }
    } catch (err) {
      console.error({ err });
      showToast("Error de conexión.", "error");
    } finally {
      setSubiendoMetricas(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl w-full flex flex-col gap-4 sm:w-4/5 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-auto text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          Subir Métricas de Analistas y Empleados
        </h2>
        <div className="space-y-2 flex flex-col gap-2">
          <label
            htmlFor="input-metricas"
            className="text-sm font-medium text-gray-700"
          >
            Adjuntar archivo en formato CSV
          </label>
          {file ? (
            <div className="flex justify-between items-center gap-2">
              <div className="mt-2 flex items-center space-x-2 text-green-600">
                <FileCheck className="w-5 h-5" />
                <span className="text-sm">{file.name}</span>
              </div>
              <button
                className="opacity-50 hover:opacity-100 transition"
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
              >
                <XCircle />
              </button>
            </div>
          ) : (
            <div className="relative border-2 border-dashed hover:bg-gray-100 border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-primary-500 transition-colors cursor-pointer">
              <input
                id="input-metricas"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".csv"
                type="file"
                ref={inputMetricasRef}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <div className="flex flex-col items-center text-gray-500">
                <UploadCloud className="h-8 w-8 mb-1" />
                <span className="text-sm">
                  Haz click o arrastra tu archivo CSV aquí
                </span>
              </div>
            </div>
          )}
        </div>

                {/*seleccionar periodo */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-black mb-2">
            Seleccionar periodo
          </label>
          <select
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
          >
            <option value="">Seleccione un periodo</option>
            {periodos.map((p) => (
              <option key={p.id_periodo} value={p.id_periodo}>
                {p.nombre_periodo}
              </option>
            ))}
          </select>
        </div>


        <div>
          <a
            className="mx-auto text-indigo-500 hover:underline group text-xs flex items-center w-fit"
            target="_blank"
            href="https://docs.google.com/spreadsheets/d/1huAWWzslooGEnzRjIEd8jDAb-i16xrx-pEeXcfsf0Bo/edit?gid=1723363062#gid=1723363062"
          >
            Asegurate de seguir esta plantilla{" "}
            <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition" />
          </a>
        </div>
        <DialogFooter className="flex *:flex-1 gap-2">
          <button
            disabled={subiendoMetricas}
            onClick={onClose}
            className="bg-gray-300 py-2 px-4 rounded text-black hover:bg-gray-400 focus:outline-none w-full text-center"
          >
            Cancelar
          </button>
          <button
            onClick={subirMetricasDesdeCSV}
            className={`bg-indigo-500 disabled:opacity-50 text-white py-2 px-4 rounded hover:bg-indigo-600 focus:outline-none w-full text-center ${
              subiendoMetricas
                ? "bg-gray-400"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            disabled={subiendoMetricas}
          >
            {subiendoMetricas ? "Cargando..." : "Subir"}
          </button>
        </DialogFooter>
      </div>
    </div>
  );
}
