import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import MensajeAlerta from "../MensajeAlerta";

export default function PasoCuatroEncuesta({ formData, onBack, onFinish, onCancel }) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [encuestaCreada, setEncuestaCreada] = useState(false);

  const tipoLabel = {
    clima: "Clima Laboral",
    uso: "Uso de la Plataforma",
    desempeño: "Desempeño",
    capacitacion: "Capacitación y Desarrollo",
    diversidad: "Diversidad e Inclusión",
    otro: "Otro",
  };

  const formatFecha = (fecha) =>
    fecha ? format(new Date(fecha), "dd/MM/yyyy", { locale: es }) : "-";

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              n === 4 ? "bg-blue-500 text-white" : "bg-white text-black"
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-black">Resumen de la encuesta</h2>

      <div className="space-y-2 text-black">
        <p><strong>Tipo:</strong> {tipoLabel[formData.tipo] || formData.tipo}</p>
        <p><strong>Título:</strong> {formData.titulo}</p>
        <p><strong>Descripción:</strong> {formData.descripcion || "-"}</p>
        <p><strong>¿Anónima?:</strong> {formData.anonima === "si" ? "Sí" : "No"}</p>
        <p>
          <strong>Rango de fechas:</strong>{" "}
          {formData.fechas?.from
            ? `${formatFecha(formData.fechas.from)} hasta ${formatFecha(formData.fechas.to)}`
            : "No definido"}
        </p>
      </div>

      <hr className="my-4" />

      <h3 className="font-semibold text-black">Dirigido a:</h3>

      {formData.destinatario === "empleado" && (
        <div className="text-black space-y-1">
          <p className="font-medium">Empleados seleccionados:</p>
          <ul className="list-disc ml-6">
            {(formData.empleadosDatos || []).map((emp, i) => (
              <li key={i}>
                {emp.nombre} {emp.apellido} —{" "}
                <span className="text-sm text-gray-600">{emp.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {formData.destinatario === "area" && (
        <p className="text-black">Área seleccionada: {formData.area}</p>
      )}

      {formData.destinatario === "puesto" && (
        <p className="text-black">Puesto seleccionado: {formData.puesto}</p>
      )}

      <hr className="my-4" />

      <h3 className="font-semibold text-black">Preguntas:</h3>
      {(formData.preguntas || []).length === 0 && (
        <p className="text-gray-600">No hay preguntas agregadas.</p>
      )}
      <ul className="space-y-2 text-black text-sm">
        {(formData.preguntas || []).map((p, i) => (
          <li key={i} className="border p-3 rounded bg-gray-50 space-y-1">
            <strong>{p.texto}</strong> <em className="text-gray-600">({p.tipo})</em>
            {p.opciones?.length > 0 && (
              <ul className="list-disc ml-6">
                {p.opciones.map((op, j) => (
                  <li key={j}>{op}</li>
                ))}
              </ul>
            )}
            {p.permitir_comentario && (
              <p className="text-xs text-gray-600">Incluye comentario adicional</p>
            )}
            {p.obligatoria && (
              <p className="text-xs text-red-500">Pregunta obligatoria</p>
            )}
          </li>
        ))}
      </ul>

      {/* Mensaje de éxito justo arriba del bloque de botones */}
      {encuestaCreada && (
        <MensajeAlerta
          texto="Encuesta creada correctamente"
          tipo="success"
          className="mb-4"
        />
      )}

      {/* Botones */}
      <div className="flex justify-between gap-2 pt-6">
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
            onClick={() => {
              setEncuestaCreada(true);
              setTimeout(() => {
                onFinish(); // redirige después de mostrar el mensaje
              }, 2000);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Finalizar
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
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