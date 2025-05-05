import { fakeOffers } from "./fakeOffers"

export const analistaService = {
  async obtenerOfertas(){
    return new Promise((res) => setTimeout(() => res(fakeOffers), 2000))

    // Descomentar este codigo de abajo cuando ande el backend

  //   const url = `${API_URL}/ofertas`

  //   try {
  //     const response = await fetch(url, {
  //       credentials: "include"
  //     })

  //     if(!response.ok){
  //       throw new Error()
  //     }

  //     const json = await response.json()
  //     return json
  //   } catch (error) {
  //     console.error({error});
  //   }
  // }
  }
}