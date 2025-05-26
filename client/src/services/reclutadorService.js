import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export const reclutadorService = {
  async obtenerOfertas() {
    const url = `${API_URL}/api/mis-ofertas-laborales-reclutador`;

    const data = await fetcher({ url });
    return data.ofertas;
  },
  async obtenerCandidatos({
    idOferta,
    nombre,
    isApto,
    fechaDesde,
    fechaHasta,
  }) {
    const params = new URLSearchParams();

    if (nombre) params.append("nombre", nombre);
    if (isApto !== undefined) params.append("is_apto", isApto);
    if (fechaDesde) params.append("fecha_desde", fechaDesde);
    if (fechaHasta) params.append("fecha_hasta", fechaHasta);

    const url = `${API_URL}/api/ver_candidatos/${idOferta}/filtrar?${params.toString()}`;

    const data = await fetcher({ url });
    return data;
  },
  async subirCertificado({ file }) {
    const url = `${API_URL}/api/subir-certificado`;

    const formData = new FormData();
    formData.append("file", file);

    const options = {
      method: "POST",
      body: formData,
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async solicitarLicencia({ tipoLicencia, descripcion, certificadoUrl }) {
    const url = `${API_URL}/api/solicitud-licencia`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lic_type: tipoLicencia,
        description: descripcion,
        certificado_url: certificadoUrl,
      }),
    };

    const data = await fetcher({ url, options });
    return data.licencia;
  },
  async misLicencias() {
    const url = `${API_URL}/api/mis-licencias`;

    const data = await fetcher({ url });
    return data;
  },
  async obtenerLicenciasACargo() {
    const url = `${API_URL}/api/licencias-mis-empleados`;

    const data = await fetcher({ url });
    return data;
  },
  async definirPalabrasClave({ idOferta, palabrasClave }) {
    const url = `${API_URL}/api/definir_palabras_clave/${idOferta}`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ palabras_clave: palabrasClave }),
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async evaluarLicencia({
    idLicencia,
    estado,
    fechaInicioSugerida,
    fechaFinSugerida,
    motivo
  }) {
    const url = `${API_URL}/api/licencia-${idLicencia}-empleado/evaluacion`;

    console.log({ fechaFinSugerida, fechaInicioSugerida });


    const options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        estado,
        motivo,
        fecha_inicio_sugerida: fechaInicioSugerida,
        fecha_fin_sugerida: fechaFinSugerida,
      }),
    };

    const data = await fetcher({ url, options });
    return data;
  },
};
