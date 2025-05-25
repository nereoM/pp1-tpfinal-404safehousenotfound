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
  // async evaluarLicencia({ idLicencia, estado }) {
  //   const url = `${API_URL}/api/evaluar-licencia/${idLicencia}`;

  //   const options = {
  //     method: "PUT",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ estado }),
  //   };

  //   const data = await fetcher({ url, options });
  //   return data;
  // },
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
  async evaluarLicencia({ idLicencia, estado, motivo, fecha_inicio, fecha_fin }) {
    const url = `${API_URL}/api/licencia-${idLicencia}-reclutador/evaluacion`

    const options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado, motivo }),
    };
    const data = await fetcher({ url, options });
    return data;
  }
}

