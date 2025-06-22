import React, { useEffect, useState } from "react";

export default function RendimientoAnalistasTable({ onSuccess, onClose }) {
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [saving, setSaving] = useState(false);
  const [periodos, setPeriodos] = useState([]);
  const [idPeriodo, setIdPeriodo] = useState("");
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [periodoCerrado, setPeriodoCerrado] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroPuesto, setFiltroPuesto] = useState("");

  // Cargar periodos al montar
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/listar-periodos`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setPeriodos(data))
      .catch(() => setPeriodos([]));
  }, []);

  // Cargar datos del periodo seleccionado y su estado
  useEffect(() => {
    if (!idPeriodo) {
      setRows([]);
      setOriginalRows([]);
      setPeriodoSeleccionado(null);
      setPeriodoCerrado(false);
      return;
    }
    setLoading(true);
    const periodo = periodos.find(
      (p) => String(p.id_periodo) === String(idPeriodo)
    );
    setPeriodoSeleccionado(periodo || null);
    setPeriodoCerrado(periodo?.estado === "cerrado");

    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/empleados-datos-rendimiento-manager?periodo=${idPeriodo}`,
      {
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.datos_empleados) {
          setRows(data.datos_empleados);
          setOriginalRows(data.datos_empleados); // Guardar snapshot original
        } else {
          setRows([]);
          setOriginalRows([]);
        }
      })
      .catch(() => {
        setRows([]);
        setOriginalRows([]);
      })
      .finally(() => setLoading(false));
  }, [idPeriodo, periodos]);

  // Detectar si hay cambios respecto a los datos originales
  const hayCambios = React.useMemo(() => {
    if (rows.length !== originalRows.length) return false;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const o = originalRows[i];
      if (!o) return true;
      if (
        Number(r.horas_extra_finde) !== Number(o.horas_extra_finde) ||
        Number(r.horas_capacitacion) !== Number(o.horas_capacitacion) ||
        Number(r.ausencias_injustificadas) !==
          Number(o.ausencias_injustificadas) ||
        Number(r.llegadas_tarde) !== Number(o.llegadas_tarde) ||
        Number(r.salidas_tempranas) !== Number(o.salidas_tempranas)
      ) {
        return true;
      }
    }
    return false;
  }, [rows, originalRows]);

  // Obtener lista de puestos únicos para el filtro
  const puestosUnicos = React.useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.puesto || "Analista de RRHH").filter(Boolean))
      ),
    [rows]
  );

  // Filtrar filas por búsqueda y puesto
  const rowsFiltradas = rows.filter((row) => {
    const nombre = row.nombre?.toLowerCase() || "";
    const apellido = row.apellido?.toLowerCase() || "";
    const puesto = (row.puesto || "Analista de RRHH").toLowerCase();
    const textoBusqueda = busqueda.toLowerCase();

    const coincideBusqueda =
      nombre.includes(textoBusqueda) || apellido.includes(textoBusqueda);

    const coincidePuesto =
      !filtroPuesto || puesto === filtroPuesto.toLowerCase();

    return coincideBusqueda && coincidePuesto;
  });

  // Manejar edición de celdas
  const handleChange = (idx, field, value) => {
    setRows((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  // Validar límites según el periodo seleccionado
  const validarLimites = (row) => {
    if (!periodoSeleccionado) return [];
    const errores = [];
    const max_aus = periodoSeleccionado.dias_laborales_en_periodo;
    const max_ext =
      periodoSeleccionado.horas_laborales_por_dia *
        periodoSeleccionado.dias_laborales_en_periodo +
      periodoSeleccionado.cantidad_findes *
        2 *
        periodoSeleccionado.horas_laborales_por_dia;
    const max_cap = Math.floor(max_ext / 2);
    const max_lt = periodoSeleccionado.dias_laborales_en_periodo;
    const max_st = periodoSeleccionado.dias_laborales_en_periodo;

    if (Number(row.ausencias_injustificadas) > max_aus)
      errores.push(
        `Ausencias injustificadas (${row.ausencias_injustificadas}) supera el máximo permitido (${max_aus})`
      );
    if (Number(row.horas_capacitacion) > max_cap)
      errores.push(
        `Horas capacitación (${row.horas_capacitacion}) supera el máximo permitido (${max_cap})`
      );
    if (Number(row.horas_extra_finde) > max_ext)
      errores.push(
        `Horas extra finde (${row.horas_extra_finde}) supera el máximo permitido (${max_ext})`
      );
    if (Number(row.llegadas_tarde) > max_lt)
      errores.push(
        `Llegadas tarde (${row.llegadas_tarde}) supera el máximo permitido (${max_lt})`
      );
    if (Number(row.salidas_tempranas) > max_st)
      errores.push(
        `Salidas tempranas (${row.salidas_tempranas}) supera el máximo permitido (${max_st})`
      );
    return errores;
  };

  // Enviar datos editados
  const handleGuardar = async () => {
    setSaving(true);
    setMensaje("");
    setTipoMensaje("success");

    const campos = [
      "horas_extra_finde",
      "horas_capacitacion",
      "ausencias_injustificadas",
      "llegadas_tarde",
      "salidas_tempranas",
    ];

    if (!idPeriodo) {
      setTipoMensaje("error");
      setMensaje("Debes seleccionar un periodo activo.");
      setSaving(false);
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    if (periodoCerrado) {
      setTipoMensaje("error");
      setMensaje("No se pueden modificar los datos para un periodo cerrado.");
      setSaving(false);
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    // Empleados con todos los campos completos y válidos
    const empleadosValidos = rows.filter((row) =>
      campos.every(
        (key) =>
          row[key] !== "" &&
          row[key] !== undefined &&
          row[key] !== null &&
          !isNaN(Number(row[key]))
      )
    );

    // Empleados con al menos un campo numérico completado pero no todos
    const empleadosIncompletos = rows.filter((row) => {
      const completados = campos.filter(
        (key) =>
          row[key] !== "" &&
          row[key] !== undefined &&
          row[key] !== null &&
          !isNaN(Number(row[key]))
      ).length;
      return completados > 0 && completados < campos.length;
    });

    if (empleadosIncompletos.length > 0) {
      setSaving(false);
      setTipoMensaje("error");
      setMensaje(
        `Completa todos los campos numéricos para el empleado ${empleadosIncompletos[0].nombre} ${empleadosIncompletos[0].apellido}.`
      );
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    if (empleadosValidos.length === 0) {
      setSaving(false);
      setTipoMensaje("error");
      setMensaje("Ningún valor fue modificado.");
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    // Validar límites
    for (const row of empleadosValidos) {
      const erroresLimite = validarLimites(row);
      if (erroresLimite.length > 0) {
        setSaving(false);
        setTipoMensaje("error");
        setMensaje(
          `Error en ${row.nombre} ${row.apellido}: ${erroresLimite.join(", ")}`
        );
        setTimeout(() => setMensaje(""), 7000);
        return;
      }
    }

    try {
      const payload = empleadosValidos.map((row) => ({
        id_empleado: row.id_usuario,
        horas_extras: Number(row.horas_extra_finde),
        horas_capacitacion: Number(row.horas_capacitacion),
        ausencias_injustificadas: Number(row.ausencias_injustificadas),
        llegadas_tarde: Number(row.llegadas_tarde),
        salidas_tempranas: Number(row.salidas_tempranas),
      }));

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cargar-rendimientos-empleados`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ empleados: payload, id_periodo: idPeriodo }),
        }
      );

      const contentType = res.headers.get("content-type") || "";

      if (res.ok) {
        let data = null;
        try {
          if (contentType.includes("application/json")) {
            data = await res.json();
            setMensaje(data.message || "Datos guardados correctamente.");
          } else {
            await res.text();
            setMensaje("Datos guardados correctamente.");
          }
        } catch {
          setMensaje("Datos guardados correctamente.");
        }
        setTipoMensaje("success");
      } else {
        let errorMsg = "Error: Los datos no fueron modificados.";
        try {
          if (contentType.includes("application/json")) {
            const data = await res.json();
            // Si el back devuelve errores de límites, los mostramos todos
            if (
              data.errores &&
              Array.isArray(data.errores) &&
              data.errores.length > 0
            ) {
              errorMsg = data.errores
                .map(
                  (e) =>
                    `Empleado ${e.id_empleado}: ${e.campo} (${e.valor}) supera el máximo (${e.maximo})`
                )
                .join(" | ");
            } else {
              errorMsg = data.error || data.message || errorMsg;
            }
          } else {
            errorMsg = (await res.text()) || errorMsg;
          }
        } catch {}
        setTipoMensaje("error");
        setMensaje("Error:" + errorMsg);
      }
    } catch {
      setTipoMensaje("error");
      setMensaje("Error de red.");
    }
    setSaving(false);
    setTimeout(() => setMensaje(""), 7000);
  };

  return (
    <div className="w-full" style={{ maxWidth: "none" }}>
      <h2 className="text-2xl font-extrabold mb-6 text-blue-900 flex items-center gap-2">
        Editar Métricas de Analistas y Empleados
      </h2>
      {/* Selector de periodo */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Periodo</label>
        <select
          value={idPeriodo}
          onChange={(e) => setIdPeriodo(e.target.value)}
          className="border px-3 py-2 rounded text-xs w-64"
        >
          <option value="">Selecciona un periodo</option>
          {periodos.map((p) => (
            <option key={p.id_periodo} value={p.id_periodo}>
              {p.nombre_periodo} ({p.fecha_inicio} a {p.fecha_fin}) [{p.estado}]
            </option>
          ))}
        </select>
      </div>
      {/* Filtros */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">
          Filtros de búsqueda
        </label>
        <div className="flex flex-wrap gap-4 mt-1">
          <input
            type="text"
            placeholder="Buscar por nombre o apellido"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border px-3 py-2 rounded text-xs w-64"
          />
          <select
            value={filtroPuesto}
            onChange={(e) => setFiltroPuesto(e.target.value)}
            className="border px-3 py-2 rounded text-xs w-64"
          >
            <option value="">Todos los puestos</option>
            {puestosUnicos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-500 text-lg">
          <svg
            className="animate-spin h-6 w-6 mr-2 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          Cargando datos...
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 w-full">
            <table className="w-full text-xs">
              <thead className="bg-blue-50">
                <tr>
                  <th className="p-3 border-b text-left font-semibold text-blue-900">
                    Nombre
                  </th>
                  <th className="p-3 border-b text-left font-semibold text-blue-900">
                    Apellido
                  </th>
                  <th className="p-3 border-b text-left font-semibold text-blue-900">
                    Puesto
                  </th>
                  <th className="p-3 border-b text-left font-semibold text-blue-900">
                    Horas Capacitación
                  </th>
                  <th className="p-3 border-b text-left font-semibold text-blue-900">
                    Horas Extra Finde
                  </th>
                  <th className="p-3 border-b text-left font-semibold text-blue-900">
                    Ausencias Injustificadas
                  </th>
                  <th className="p-3 border-b text-left font-semibold text-blue-900">
                    Llegadas Tarde
                  </th>
                  <th className="p-3 border-b text-left font-semibold text-blue-900">
                    Salidas Tempranas
                  </th>
                </tr>
              </thead>
              <tbody>
                {rowsFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-500">
                      {idPeriodo
                        ? "No se encontraron resultados para la búsqueda o filtro seleccionado."
                        : "Selecciona un periodo para ver los datos."}
                    </td>
                  </tr>
                ) : (
                  rowsFiltradas.map((row, idx) => (
                    <tr
                      key={row.id_usuario}
                      className="hover:bg-blue-50 transition"
                    >
                      <td className="p-2 border-b">{row.nombre}</td>
                      <td className="p-2 border-b">{row.apellido}</td>
                      <td className="p-2 border-b">
                        {row.puesto || "Analista de RRHH"}
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="number"
                          min={0}
                          value={row.horas_capacitacion}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || Number(val) >= 0) {
                              handleChange(
                                rows.indexOf(row),
                                "horas_capacitacion",
                                val
                              );
                            }
                          }}
                          className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                          disabled={periodoCerrado}
                        />
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="number"
                          min={0}
                          value={row.horas_extra_finde}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || Number(val) >= 0) {
                              handleChange(
                                rows.indexOf(row),
                                "horas_extra_finde",
                                val
                              );
                            }
                          }}
                          className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                          disabled={periodoCerrado}
                        />
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="number"
                          min={0}
                          value={row.ausencias_injustificadas}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || Number(val) >= 0) {
                              handleChange(
                                rows.indexOf(row),
                                "ausencias_injustificadas",
                                val
                              );
                            }
                          }}
                          className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                          disabled={periodoCerrado}
                        />
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="number"
                          min={0}
                          value={row.llegadas_tarde}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || Number(val) >= 0) {
                              handleChange(
                                rows.indexOf(row),
                                "llegadas_tarde",
                                val
                              );
                            }
                          }}
                          className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                          disabled={periodoCerrado}
                        />
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="number"
                          min={0}
                          value={row.salidas_tempranas}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || Number(val) >= 0) {
                              handleChange(
                                rows.indexOf(row),
                                "salidas_tempranas",
                                val
                              );
                            }
                          }}
                          className="w-24 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                          disabled={periodoCerrado}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={onClose}
            >
              Cerrar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving || periodoCerrado || !hayCambios}
              className={`px-6 py-2 rounded font-bold shadow transition
                    ${
                      saving || periodoCerrado || !hayCambios
                        ? "bg-indigo-300 text-white cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
            >
              {periodoCerrado ? (
                "No se pueden modificar datos en un periodo cerrado"
              ) : saving ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Guardando...
                </span>
              ) : !hayCambios ? (
                "No hay cambios para guardar"
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
          {/* Mensaje de éxito o error abajo */}
          {mensaje && (
            <div
              className={`fixed left-1/2 bottom-8 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold transition-all z-50
                            ${
                              tipoMensaje === "success"
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                            }`}
            >
              {mensaje}
            </div>
          )}
        </>
      )}
    </div>
  );
}
