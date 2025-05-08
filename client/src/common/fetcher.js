import { NotFoundError, ServerError, UnauthorizedError } from "./error";

export async function fetcher({ url, options = {} }) {
  const optionsWithCookies = { ...options, credentials: "include" }

  try {
    const response = await fetch(url, optionsWithCookies);
    if (!response.ok) {
      const errorBody = await response.json()

      if (!("error" in errorBody)) {
        throw new ServerError()
      }

      if (response.status === 401) {
        throw new UnauthorizedError(errorBody.error)
      }

      if (response.status === 404) {
        throw new NotFoundError(errorBody.error)
      }

      throw new Error(`Error desde el server: ${response.status} ${response.statusText}`);
    }
    const json = await response.json()
    return json
  } catch (error) {
    console.error({ error });
    if (!(error instanceof UnauthorizedError) && !(error instanceof NotFoundError)) {
      throw new ServerError()
    }
    throw error;
  }
}