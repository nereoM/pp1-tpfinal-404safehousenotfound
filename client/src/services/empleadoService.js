import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export const empleadoService = {
  async subirCertificado({ file }) {
    const url = `${API_URL}/api/subir-certificado-emp`;

    const formData = new FormData();
    formData.append("file", file);

    const options = {
      method: "POST",
      body: formData,
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async solicitarLicencia({ tipoLicencia, descripcion, certificadoUrl, fechaInicio, fechaFin }) {
    const url = `${API_URL}/api/solicitar-licencia`;

    const options = {
      body: JSON.stringify({
        lic_type: tipoLicencia,
        description: descripcion,
        certificado_url: certificadoUrl,
        start_date: fechaInicio,
        end_date: fechaFin
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const data = await fetcher({ url, options });
    return data;
  },
  /**
   * Obtiene la lista de licencias del empleado autenticado.
   *
   * @returns {Promise<[Licencia]>} Lista de licencias del empleado
   */
  async misLicencias() {
    const url = `${API_URL}/api/mis-licencias-empleado`;

    const data = await fetcher({ url });
    return data;
  },
  /**
   * Obtiene las ofertas laborales publicadas por una empresa específica,
   * permitiendo aplicar filtros opcionales como modalidad, ubicación, experiencia, etc.
   *
   * @param {Object} params
   * @param {string} params.nombreEmpresa - Nombre exacto de la empresa.
   * @param {string} [params.modalidad] - Modalidad de trabajo (remoto, presencial, híbrido).
   * @param {string} [params.location] - Ubicación de la oferta.
   * @param {string} [params.experience_level] - Nivel de experiencia requerido.
   *
   * @returns {Promise<OfertasEmpresa>} Resolves con un objeto que contiene los datos de la empresa y un array de ofertas.
   */
  async obtenerOfertasEmpresa({
    nombreEmpresa,
    modalidad,
    location,
    experienceLevel,
  }) {
    const queryParams = new URLSearchParams();

    if (modalidad) queryParams.append("modalidad", modalidad);
    if (location) queryParams.append("location", location);
    if (experienceLevel)
      queryParams.append("experience_level", experienceLevel);

    const url = `${API_URL}/api/ver-ofertas-empresa/${encodeURIComponent(
      nombreEmpresa
    )}?${queryParams.toString()}`;

    const data = await fetcher({ url });
    return data;
  },
  async subirCV({ file }) {
    const url = `${API_URL}/api/upload-cv-empleado`;

    const formData = new FormData();
    formData.append("file", file);

    const options = {
      method: "POST",
      body: formData,
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async obtenerOfertasLaborales({
    nombreEmpresa,
    location,
    workplaceType,
    employmentType,
    experienceLevel,
    keywords,
    salaryMin,
    salaryMax,
  }) {
    const queryParams = new URLSearchParams();

    if (location) queryParams.append("location", location);
    if (workplaceType) queryParams.append("workplace_type", workplaceType);
    if (employmentType) queryParams.append("employment_type", employmentType);
    if (experienceLevel)
      queryParams.append("experience_level", experienceLevel);
    if (keywords) queryParams.append("keywords", keywords);
    if (salaryMin !== undefined) queryParams.append("salary_min", salaryMin);
    if (salaryMax !== undefined) queryParams.append("salary_max", salaryMax);

    const url = `${API_URL}/api/empresas-empleado/${nombreEmpresa}/ofertas?${queryParams.toString()}`;

    const data = await fetcher({ url });
    return data;
  },
  /**
   * Obtiene ofertas labores recomendadas a partir del cv subido por el empleado
   *
   * @returns {Promise<[OfertaRecomendada]>}
   */
  async obtenerRecomendaciones() {
    const url = `${API_URL}/api/recomendaciones-empleado`;

    const data = await fetcher({ url });
    return data;
  },
  /**
   * Obtiene la información básica del empleado autenticado mediante JWT.
   *
   * @returns {Promise<UserInfo>}
   */
  async obtenerInfoEmpleado() {
    const url = `${API_URL}/api/info-empleado`;

    const data = await fetcher({ url });
    return data;
  },
  /**
   * Obtiene un listado con ofertas
   *
   * @returns {Promise<OfertaFiltrada[]>}
   */
  async obtenerOfertasFiltradas({
    location,
    workplaceType,
    employmentType,
    experienceLevel,
    keywords,
    salaryMin,
    salaryMax,
  }) {
    const queryParams = new URLSearchParams();

    if (location) queryParams.append("location", location);
    if (workplaceType) queryParams.append("workplace_type", workplaceType);
    if (employmentType) queryParams.append("employment_type", employmentType);
    if (experienceLevel)
      queryParams.append("experience_level", experienceLevel);
    if (keywords) queryParams.append("keywords", keywords);
    if (salaryMin) queryParams.append("salary_min", salaryMin);
    if (salaryMax) queryParams.append("salary_max", salaryMax);

    const url = `${API_URL}/api/ofertas-filtradas-empleado?${queryParams.toString()}`;

    const data = await fetcher({ url });
    return data;
  },
  /**
   *
   * @returns { Promise<[CV]>}
   */
  async obtenerMisCvs() {
    const url = `${API_URL}/api/mis-cvs-empleado`;

    const data = await fetcher({ url });
    return data;
  },
  async postularse({ idOferta, idCv }) {
    const url = `${API_URL}/api/postularme-empleado/${idOferta}`;

    const options = {
      method: "POST",
      body: JSON.stringify({
        id_cv: idCv,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };

    const data = await fetcher({ url, options });
    return data;
  },
  async subirImagen({ file }) {
    const url = `${API_URL}/api/subir-image-empleado`;

    const formData = new FormData();
    formData.append("file", file);

    const options = {
      method: "POST",
      body: formData,
    };

    const data = await fetcher({ url, options });
    return data;
  },
  /**
   * @returns {Promise<EstadoPostulacion[]>}
   */
  async obtenerEstadoPostulaciones() {
    const url = `${API_URL}/api/estado-postulaciones-empleado`;

    const data = await fetcher({ url });
    return data;
  },
  async responderSugerenciaLicencia({ licenciaId, aceptacion }) {
    const url = `${API_URL}/api/licencia-${licenciaId}/respuesta-sugerencia`

    const options = {
      method: "PUT",
      body: JSON.stringify({ aceptacion }),
      headers: {
        "Content-Type": "application/json",
      },
    };

    const data = await fetcher({ url, options })
    return data
  },
  async cancelarLicencia({ licenciaId }) {
    // TODO
    const url = `${API_URL}/api/licencia-${licenciaId}/cancelar`

    const options = {
      method: "PUT",
    };

    const data = await fetcher({ url, options })
    return data
  },
};
