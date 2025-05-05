const API_URL = import.meta.env.VITE_API_URL;

export const analistaService = {
  async obtenerOfertas() {
    const url = `${API_URL}/api/reclutador/mis-ofertas-laborales`

    try {
      const response = await fetch(url, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error()
      }

      const json = await response.json()
      return json.ofertas
    } catch (error) {
      console.error({ error });
    }
  }
}