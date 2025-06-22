import { useState } from "react";

export default function PasoTresEncuesta({ formData, setFormData, onNext, onBack, onCancel }) {
  const [pregunta, setPregunta] = useState("");
  const [tipoPregunta, setTipoPregunta] = useState("");
  const [esObligatoria, setEsObligatoria] = useState(false);
  const [opciones, setOpciones] = useState(["Excelente", "Buena", "Regular", "Mala"]);
  const [nuevaOpcion, setNuevaOpcion] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [errores, setErrores] = useState({});
  const [errorPaso, setErrorPaso] = useState("");

  const preguntasAgregadas = formData.preguntas || [];

  const validarFormularioActual = () => {
    const nuevosErrores = {};
    if (!tipoPregunta) nuevosErrores.tipo = "Debe seleccionar un tipo de pregunta.";
    if (!pregunta.trim()) nuevosErrores.pregunta = "La pregunta no puede estar vacía.";
    if (tipoPregunta !== "rellena el usuario" && opciones.length === 0) {
      nuevosErrores.opciones = "Debe tener al menos una opción de respuesta.";
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarPregunta = () => {
    if (!validarFormularioActual()) return;

    const nuevaPregunta = {
      texto: pregunta.trim(),
      tipo: tipoPregunta,
      opciones: tipoPregunta === "rellena el usuario" ? [] : opciones,
      es_requerida: esObligatoria, // CAMBIO: el backend espera 'es_requerida'
    };

    const nuevasPreguntas =
      editIndex !== null
        ? preguntasAgregadas.map((p, i) => (i === editIndex ? nuevaPregunta : p))
        : [...preguntasAgregadas, nuevaPregunta];

    setFormData({ ...formData, preguntas: nuevasPreguntas });
    setPregunta("");
    setOpciones(["Excelente", "Buena", "Regular", "Mala"]);
    setTipoPregunta("");
    setEsObligatoria(false);
    setEditIndex(null);
    setErrores({});
  };

  const handleSiguientePaso = () => {
    const tienePreguntas = preguntasAgregadas.length > 0;

    if (!tienePreguntas) {
      const esFormularioValido = validarFormularioActual();
      if (!esFormularioValido) {
        setErrorPaso("");
        return;
      }
      setErrorPaso("Debés agregar al menos una pregunta antes de continuar.");
      return;
    }

    setErrorPaso("");
    onNext();
  };

  const agregarOpcion = () => {
    if (nuevaOpcion.trim() && !opciones.includes(nuevaOpcion.trim())) {
      setOpciones([...opciones, nuevaOpcion.trim()]);
      setNuevaOpcion("");
    }
  };

  const eliminarOpcion = (index) => {
    setOpciones(opciones.filter((_, i) => i !== index));
  };

  const editarPregunta = (index) => {
    const p = preguntasAgregadas[index];
    setPregunta(p.texto);
    setTipoPregunta(p.tipo || "");
    setEsObligatoria(p.obligatoria || false);
    setOpciones(p.opciones?.length ? p.opciones : []);
    setEditIndex(index);
  };

  const eliminarPregunta = (index) => {
    const nuevasPreguntas = preguntasAgregadas.filter((_, i) => i !== index);
    setFormData({ ...formData, preguntas: nuevasPreguntas });
    if (editIndex === index) {
      setPregunta("");
      setOpciones(["Excelente", "Buena", "Regular", "Mala"]);
      setTipoPregunta("");
      setEsObligatoria(false);
      setEditIndex(null);
    }
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              n === 3 ? "bg-blue-500 text-white" : "bg-white text-black"
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      <label className="block text-sm font-medium text-black">Tipo de pregunta</label>
      <select
        value={tipoPregunta}
        onChange={(e) => {
          setTipoPregunta(e.target.value);
          setErrores((prev) => ({ ...prev, tipo: null }));
        }}
        className="w-full border p-2 rounded text-black bg-white"
      >
        <option value="" disabled hidden>Seleccione una opción</option>
        <option value="opcion unica">Opción única</option>
        <option value="opcion multiple">Opción múltiple</option>
        <option value="rellena el usuario">Rellena el usuario</option>
      </select>
      {errores.tipo && <p className="text-sm text-red-600 mt-1">{errores.tipo}</p>}

      <label className="block text-sm font-medium text-black mt-2">Pregunta</label>
      <input
        type="text"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        className="w-full border p-2 rounded text-black"
        placeholder="¿Cómo fue tu experiencia con el uso de la app?"
      />
      {errores.pregunta && <p className="text-red-600 text-sm">{errores.pregunta}</p>}

      <div className="pt-2">
        <label className="flex items-center gap-2 text-black">
          <input
            type="checkbox"
            checked={esObligatoria}
            onChange={(e) => setEsObligatoria(e.target.checked)}
          />
          ¿Pregunta obligatoria?
        </label>
      </div>

      {tipoPregunta !== "rellena el usuario" && (
        <>
          <label className="block text-sm font-medium text-black">Opciones de respuesta:</label>
          {errores.opciones && <p className="text-red-600 text-sm">{errores.opciones}</p>}
          <ul className="space-y-1">
            {opciones.map((op, index) => (
              <li
                key={index}
                className="flex items-center gap-2 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="accent-green-500 w-4 h-4 pointer-events-none"
                />
                <span className="text-black flex-1">{op}</span>
                <button
                  onClick={() => eliminarOpcion(index)}
                  className="text-red-600 font-bold text-lg hover:text-red-800"
                  title="Eliminar opción"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nuevaOpcion}
              onChange={(e) => setNuevaOpcion(e.target.value)}
              className="border p-2 rounded text-black flex-1"
              placeholder="Nueva opción"
            />
            <button onClick={agregarOpcion} className="text-blue-600 hover:underline">
              + Agregar nueva opción
            </button>
          </div>
        </>
      )}

      <div className="flex justify-start pt-2">
        <button
          onClick={guardarPregunta}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {editIndex !== null ? "Guardar cambios" : "Agregar pregunta"}
        </button>
      </div>

      {preguntasAgregadas.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-black mb-2">Preguntas agregadas:</h3>
          <ul className="space-y-2 text-black text-sm">
            {preguntasAgregadas.map((p, i) => (
              <li key={i} className="border p-3 rounded bg-gray-50 space-y-1">
                <strong>{p.texto}</strong> <em className="text-gray-600">({p.tipo})</em>
                {p.opciones?.length > 0 && (
                  <ul className="list-disc ml-6">
                    {p.opciones.map((op, j) => (
                      <li key={j}>{op}</li>
                    ))}
                  </ul>
                )}
                {p.obligatoria && (
                  <p className="text-xs text-red-500">Esta pregunta es obligatoria</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => editarPregunta(i)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarPregunta(i)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {errorPaso && <p className="text-red-600 text-sm mt-2">{errorPaso}</p>}

      <div className="flex justify-between gap-2 pt-4">
        <button
          onClick={() => setMostrarConfirmacion(true)}
          className="px-4 py-2 bg-red-300 text-black rounded hover:bg-red-400"
        >
          Cancelar
        </button>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
          >
            Atrás
          </button>
          <button
            onClick={handleSiguientePaso}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Siguiente
          </button>
        </div>
      </div>

      {mostrarConfirmacion && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg text-center space-y-4 w-80">
            <p className="text-black font-medium">¿Estás seguro que querés cancelar?</p>
            <p className="text-sm text-gray-700">Perderás los pasos ya hechos.</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
              >
                No, volver
              </button>
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  onCancel();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
