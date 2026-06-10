class InternalServerError extends Error {
  constructor({ cause, statusCode } = {}) {
    super("Entre em contato com o suporte para resolver este problema.");
    this.name = "InternalServerError";
    this.statusCode = statusCode || 500;
    this.cause = cause;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

class MethodNotAllowedError extends Error {
  constructor() {
    super("Method not allowed");
    this.name = "MethodNotAllowedError";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

class ValidationError extends Error {
  constructor({ message, action, statusCode } = {}) {
    super(message || "Validation failed");
    this.name = "ValidationError";
    this.action = action;
    this.statusCode = statusCode || 409;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

class UnauthorizedError extends Error {
  constructor({ message, action, statusCode } = {}) {
    super(message || "Usuário não autenticado.");
    this.name = "UnauthorizedError";
    this.action = action;
    this.statusCode = statusCode || 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

class ForbiddenError extends Error {
  constructor({ message, action, statusCode } = {}) {
    super(message || "Você não tem permissão para realizar esta ação.");
    this.name = "ForbiddenError";
    this.action = action;
    this.statusCode = statusCode || 403;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  UnauthorizedError,
  ValidationError,
};
