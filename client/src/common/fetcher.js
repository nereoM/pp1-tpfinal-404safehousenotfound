import { NotFoundError, UnauthorizedError } from "./error";

export async function fetcher({ url, options = {} }) {
  const optionsWithCookies = { ...options, credentials: "include" }

  try {
    const response = await fetch(url, optionsWithCookies);
    if (!response.ok) {
      if (response.status === 401) {
        throw new UnauthorizedError()
      }
      if (response.status === 404) {
        throw new NotFoundError()
      }
      throw new Error(`Error desde el server: ${response.status} ${response.statusText}`);
    }
    const json = await response.json()
    return json
  } catch (error) {
    console.error({ error });
    throw error;
  }
}