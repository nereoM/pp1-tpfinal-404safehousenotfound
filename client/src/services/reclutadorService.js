import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export const reclutadorService = {
  async obtenerOfertas() {
    const url = `${API_URL}/api/mis-ofertas-laborales-reclutador`

    const data = await fetcher({ url })
    return data.ofertas
  },
  async obtenerCandidatos({ idOferta }) {
    const url = `${API_URL}/api/ver_candidatos/${idOferta}`;

    const data = await fetcher({ url });
    return data;
  },
  async subirCertificadoLicencia({ idLicencia, file }) {
    const url = `${API_URL}/api/subir-certificado/${idLicencia}`;

    const formData = new FormData();
    formData.append("file", file);

    const options = {
      method: "POST",
      body: formData,
    };

    const data = await fetcher({ url, options });
    return data.certificado_url;
  },
  async solicitarLicencia({ tipoLicencia, descripcion }) {
    const url = `${API_URL}/api/solicitud-licencia`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lic_type: tipoLicencia, description: descripcion }),
    };

    const data = await fetcher({ url, options });
    return data.licencia;
  },
  async misLicencias() {
    const url = `${API_URL}/api/mis-licencias`;

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
  }
}

