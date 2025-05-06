import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export const reclutadorService = {
  async obtenerOfertas() {
    const url = `${API_URL}/api/reclutador/mis-ofertas-laborales`

    const data = await fetcher({ url })
    return data.ofertas
  }
}

