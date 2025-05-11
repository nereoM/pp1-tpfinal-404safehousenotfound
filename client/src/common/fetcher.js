import { ForbiddenError, NotFoundError, ServerError, UnauthorizedError } from "./error";

export async function fetcher({ url, options = {} }) {
  const optionsWithCookies = {
    ...options,
    credentials: "include"
  };

  try {
    const response = await fetch(url, optionsWithCookies);

    if (!response.ok) {
      const errorBody = await response.json();

      // Manejo de errores específicos
      if (response.status === 400) {
        throw new Error(errorBody.error || "Error de validación en el servidor.");
      }

      if (response.status === 401) {
        throw new UnauthorizedError(errorBody.error);
      }

      if (response.status === 403) {
        throw new ForbiddenError(errorBody.error);
      }

      if (response.status === 404) {
        throw new NotFoundError(errorBody.error);
      }

      if (response.status === 413) {
        throw new Error("El archivo es demasiado grande. Intente con un PDF más pequeño.");
      }

     
      throw new Error(`Error desde el server: ${response.status} ${response.statusText}`);
    }


    return await response.json();

  } catch (error) {
    console.error({ error });

    if (!(error instanceof UnauthorizedError) &&
        !(error instanceof NotFoundError) &&
        !(error instanceof ForbiddenError) &&
        !(error instanceof Error)
    ) {
      throw new ServerError();
    }

    throw error;
  }
}
