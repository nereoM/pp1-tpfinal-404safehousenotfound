import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export const candidatoService = {
  async obtenerEmpresas() {
    const url = `${API_URL}/api/empresas`

    const data = await fetcher({ url });
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

    const url = `${API_URL}/api/empresas/${encodeURIComponent(nombreEmpresa)}/ofertas?${queryParams.toString()}`;

    const data = await fetcher({ url });
    return data;
  },
  async obtenerInfoCandidato() {
    const url = `${API_URL}/api/info-candidato`

    const data = await fetcher({ url });
    return data
  },
  async obtenerMisCvs() {
    const url = `${API_URL}/api/mis-cvs`

    const data = await fetcher({ url });
    return data
  },
  async postularse({ idOferta, idCv }) {
    const url = `${API_URL}/api/postularme`;

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
  async obtenerRecomendaciones() {
    const url = `${API_URL}/api/recomendaciones`

    const data = await fetcher({ url });
    return data
  },
  async registrarEmpresa({ username, cardName, cardNumber, cardCvv, cardType, companyName }) {
    const url = `${API_URL}/api/registrar-empresa`;

    const body = {
      username,
      card_name: cardName,
      card_number: cardNumber,
      card_cvv: cardCvv,
      card_type: cardType,
      company_name: companyName,
    };

    const options = {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const data = await fetcher({ url, options })
    return data
  },
  async subirImagenPerfil({ file }) {
    const url = `${API_URL}/api/subir-image`;

    const formData = new FormData();
    formData.append("file", file);

    const options = {
      method: 'POST',
      body: formData,
    }

    const data = await fetcher({ url, options });
    return data;
  },
  async tieneCv() {
    const url = `${API_URL}/api/tiene-cv`

    const data = await fetcher({ url });
    return data
  },
  async obtenerTodasLasOfertas() {
    const url = `${API_URL}/api/todas-las-ofertas`

    const data = await fetcher({ url });
    return data
  },
  async subirCV(file) {
    const url = `${API_URL}/api/upload-cv`;

    const formData = new FormData();
    formData.append('file', file);

    const options = {
      method: 'POST',
      body: formData,
    }

    const data = await fetcher({ url, options });
    return data
  },
}
