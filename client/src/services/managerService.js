import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export const managerService = {
  async obtenerLicenciasSolicitadas() {
    const url = `${API_URL}/api/visualizar-licencias-solicitadas`

    const data = await fetcher({ url })
    return data
  },
  async registrarReclutador({ nombre, apellido, username, email }) {
    const url = `${API_URL}/api/registrar-reclutador`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: nombre, lastname: apellido, username, email }),
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async editarPalabrasClaveOferta({ idOferta, palabrasClave }) {
    const url = `${API_URL}/api/oferta/${idOferta}/palabras-clave`;

    const options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ palabras_clave: palabrasClave }),
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async obtenerOfertasLaborales() {
    const url = `${API_URL}/api/mis-ofertas-laborales`;

    const data = await fetcher({ url });
    return data.ofertas;
  },
  async obtenerEmpleados() {
    const url = `${API_URL}/api/empleados-manager`;

    const data = await fetcher({ url });
    return data;
  },
  async desvincularEmpleado({ idEmpleado }) {
    const url = `${API_URL}/api/desvincular-reclutador/${idEmpleado}`;

    const options = {
      method: "PUT",
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async crearOfertaLaboral({ nombre, descripcion, location, Argentina, employment_type, etiquetas, workplace_type, salary_min, salary_max, currency, experience_level, fecha_cierre }) {
    const ofertaData = { nombre, descripcion, location, Argentina, employment_type, etiquetas, workplace_type, salary_min, salary_max, currency, experience_level, fecha_cierre }
    const url = `${API_URL}/api/crear_oferta_laboral`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ofertaData),
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async asignarAnalistaAOferta({ idOferta, idAnalista }) {
    const url = `${API_URL}/api/asignar-analista-oferta`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_oferta: idOferta, id_analista: idAnalista }),
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async obtenerLicenciasACargo() {
    const url = `${API_URL}/api/licencias-mis-reclutadores`
    const data = await fetcher({ url });
    return data;
  },
  async misLicencias() {
    const url = `${API_URL}/api/mis-licencias-manager`;

    const data = await fetcher({ url });
    return data;
  },
  async evaluarLicencia({
    idLicencia,
    estado,
    fechaInicioSugerida,
    fechaFinSugerida,
    motivo
  }) {
    const url = `${API_URL}/api/licencia-${idLicencia}-reclutador/evaluacion`;

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
  async responderSugerenciaLicencia({ licenciaId, aceptacion }) {
    const url = `${API_URL}/api/licencia-${licenciaId}-manager/respuesta-sugerencia`

    const options = {
      method: "PUT",
      body: JSON.stringify({ aceptacion }),
      headers: {
        "Content-Type": "application/json",
      },
    };

    const data = await fetcher({ url, options })
    return data;
  },
  async obtenerOfertasAsignadas() {
    const url = `${API_URL}/api/ofertas-asignadas`;
    const data = await fetcher({ url });
    return { data }; // [{ id_oferta, id_analista }, ...]
  },
  async obtenerAnalistasAsignados() {
    const url = `${API_URL}/api/manager/ofertas-analistas`; // o como se llame
    const data = await fetcher({ url });
    // data = [{ id_oferta: 5, id_analista: 33 }, ...]
    const asignaciones = {};
    data.forEach(({ id_oferta, id_analista }) => {
      asignaciones[id_oferta] = id_analista;
    });
    return asignaciones;
  }
}

