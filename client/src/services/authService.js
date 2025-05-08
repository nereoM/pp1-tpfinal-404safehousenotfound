import { fetcher } from "../common/fetcher";

const API_URL = import.meta.env.VITE_API_URL;

export async function login(data) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  let json = null;

  try {
    json = await res.json(); // intenta parsear JSON
  } catch (e) {
    console.warn("Respuesta sin JSON válido");
  }

  if (!res.ok) {
    if (json && json.error) {
      throw new Error(json.error);
    } else if (res.status === 401) {
      throw new Error("Credenciales inválidas");
    } else if (res.status === 400) {
      throw new Error("Faltan datos para iniciar sesión");
    } else {
      throw new Error("Ocurrió un error inesperado");
    }
  }

  return json;
}

export const authService = {
  async obtenerInfoUsuario() {
    const url = `${API_URL}/auth/me`

    const data = await fetcher({ url })
    return data
  }
}