import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export const empleadoService = {
  async subirCertificado({ idLicencia, file }) {
    const url = `${API_URL}/api/subir-certificado-emp/${idLicencia}`;

    const formData = new FormData();
    formData.append("file", file);

    const options = {
      method: "POST",
      body: formData,
    }

    const data = await fetcher({ url, options })
    return data;
  },
  async solicitarLicencia({ tipoLicencia, descripcion }) {
    const url = `${API_URL}/api/solicitar-licencia`;

    const options = {
      body: JSON.stringify({ lic_type: tipoLicencia, description: descripcion }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    }

    const data = await fetcher({ url, options })
    return data;
  },
  async misLicencias() {
    const url = `${API_URL}/api/mis-licencias-emp`;

    const data = await fetcher({ url });
    return data;
  },
  async obtenerOfertasEmpresa() {
    const url = `${API_URL}/api/ver-ofertas-empresa`;

    const data = await fetcher({ url });
    return data;
  },
  async subirCV({ file }) {
    const url = `${API_URL}/api/upload-cv-empleado`;

    const formData = new FormData();
    formData.append('file', file);

    const options = {
      method: 'POST',
      body: formData,
    }

    const data = await fetcher({ url, options });
    return data
  },
  async obtenerOfertasLaborales({
    nombreEmpresa,
    location,
    workplaceType,
    employmentType,
    experienceLevel,
    keywords,
    salaryMin,
    salaryMax
  }) {
    const queryParams = new URLSearchParams();

    if (location) queryParams.append("location", location);
    if (workplaceType) queryParams.append("workplace_type", workplaceType);
    if (employmentType) queryParams.append("employment_type", employmentType);
    if (experienceLevel) queryParams.append("experience_level", experienceLevel);
    if (keywords) queryParams.append("keywords", keywords);
    if (salaryMin !== undefined) queryParams.append("salary_min", salaryMin);
    if (salaryMax !== undefined) queryParams.append("salary_max", salaryMax);

    const url = `${API_URL}/api/empresas-empleado/${encodeURIComponent(nombreEmpresa)}/ofertas?${queryParams.toString()}`;

    const data = await fetcher({ url });
    return data;
  },
  async obtenerRecomendaciones() {
    const url = `${API_URL}/api/recomendaciones-empleado`

    const data = await fetcher({ url });
    return data
  },
  async obtenerInfoEmpleado() {
    const url = `${API_URL}/api/info-empleado`

    const data = await fetcher({ url });
    return data
  },
  async obtenerOfertasFiltradas({ sector, ubicacion, modalidad }) {
    const query = new URLSearchParams();

    if (sector) query.append("sector", sector);
    if (ubicacion) query.append("ubicacion", ubicacion);
    if (modalidad) query.append("modalidad", modalidad);

    const url = `${API_URL}/api/ofertas-filtradas-empleado?${query.toString()}`;

    const data = await fetcher({ url });
    return data;
  },
  async obtenerMisCvs() {
    const url = `${API_URL}/api/mis-cvs-empleado`

    const data = await fetcher({ url })
    return data
  },
  async postularse({ idOferta, idCv }) {
    const url = `${API_URL}/api/postularme-empleado`;

    const options = {
      method: 'POST',
      body: JSON.stringify({
        id_oferta: idOferta,
        id_cv: idCv,
      }),
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const data = await fetcher({ url, options });
    return data
  },
}