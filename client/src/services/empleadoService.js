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
}