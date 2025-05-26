import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export const adminEmpService = {
  async configurarPreferencias({ slogan, descripcion, colorPrincipal, colorSecundario, colorTexto }) {
    const url = `${API_URL}/api/configurar-preferencias`
    const options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slogan,
        descripcion,
        color_princ: colorPrincipal,
        color_sec: colorSecundario,
        color_texto: colorTexto,
      }),
    }

    const data = await fetcher({ url, options })
    return data
  },
  async desvincularEmpleado({ idEmpleado }) {
    const url = `${API_URL}/api/desvincular-manager/${idEmpleado}`

    const options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }

    const data = await fetcher({ url, options })
    return data
  },
  async obtenerEmpleados() {
    const url = `${API_URL}/api/empleados-admin`

    const data = await fetcher({ url })
    return data
  },
  async obtenerPreferenciasEmpresa({ idEmpresa }) {
    const url = `${API_URL}/api/empresa/${idEmpresa}/preferencias`

    const data = await fetcher({ url })
    return data
  },
  async configurarPreferenciasParaEmpresa({ idEmpresa, slogan, descripcion, colorPrincipal, colorSecundario, colorTexto }) {
    const url = `${API_URL}/api/empresa/${idEmpresa}/preferencias`

    const options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slogan,
        descripcion,
        color_principal: colorPrincipal,
        color_secundario: colorSecundario,
        color_texto: colorTexto,
      }),
    }

    const data = await fetcher({ url, options })
    return data
  },
  async obtenerInfoAdminEmpresa() {
    const url = `${API_URL}/api/info-admin`

    const data = await fetcher({ url })
    return data
  },
  async obtenerLicenciasSolicitadas() {
    const url = `${API_URL}/api/licencias-solicitadas-admin-emp`

    const data = await fetcher({ url })
    return data
  },
  async registrarEmpleadosDesdeCSV(file) {
    const url = `${API_URL}/api/registrar-empleados`

    const formData = new FormData()
    formData.append("file", file)

    const options = {
      method: "POST",
      body: formData,
    }

    const data = await fetcher({ url, options })
    return data
  },
  async registrarManager({ name, lastname, username, email }) {
    const url = `${API_URL}/api/registrar-manager`

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, lastname, username, email }),
    }

    const data = await fetcher({ url, options })
    return data
  },
  async subirLogo(file) {
    const url = `${API_URL}/api/subir-logo`

    const formData = new FormData()
    formData.append("file", file)

    const options = {
      method: "POST",
      body: formData,
    }

    const data = await fetcher({ url, options })
    return data
  },
  async obtenerCertificado({ certificadoUrl }) {
    const url = `${API_URL}/api/ver-certificado/${certificadoUrl}`

    const data = await fetcher({ url })
    return data
  },
  async obtenerLicenciasACargo() {
    const url = `${API_URL}/api/licencias-mis-managers`;

    const data = await fetcher({ url });
    return data;
  },
  async misLicencias() {
    const url = `${API_URL}/api/licencias-mis-managers`;

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
    const url = `${API_URL}/api/licencia-${idLicencia}-manager/evaluacion`;

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
}