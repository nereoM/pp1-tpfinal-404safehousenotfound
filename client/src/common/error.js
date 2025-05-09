export class NotFoundError extends Error {
  constructor(msg = "Recurso no encontrado") {
    super(msg)
  }
}

export class UnauthorizedError extends Error {
  constructor(msg = "Insuficientes permisos") {
    super(msg)
  }
}

export class ForbiddenError extends Error {
  constructor(msg = "No es posible procesar la solicitud") {
    super(msg)
  }
}

export class ServerError extends Error {
  constructor(msg = "Error al conectarse al server") {
    super(msg)
  }
}