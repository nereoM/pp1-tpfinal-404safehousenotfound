export class NotFoundError extends Error {
  constructor() {
    super("Recurso no encontrado")
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Insuficientes permisos")
  }
}