class InternalServerError extends Error {
  constructor({ cause, statusCode } = {}) {
    super("Internal Server Error", { cause });
    this.name = "InternalServerError";
    this.message =
      "Entre em contato com o suporte para resolver este problema.";
    this.statusCode = statusCode || 500;
    this.action = undefined;
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

class ServiceServerError extends Error {
  constructor({ cause, statusCode } = {}) {
    super("Service Server Error", { cause });
    this.name = "ServiceServerError";
    this.message =
      "Entre em contato com o suporte para resolver este problema.";
    this.statusCode = statusCode || 503;
    this.action = undefined;
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

class MethodNotAllowedError extends Error {
  constructor({ cause, statusCode } = {}) {
    super("Method Not Allowed", { cause });
    this.name = "MethodNotAllowedError";
    this.message = "Method Not Allowed";
    this.action = "Verifique se o método está correto.";
    this.statusCode = statusCode || 405;
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

class ValidationError extends Error {
  constructor({ cause, message, action, statusCode } = {}) {
    super("Validation Error", { cause });
    this.name = "ValidationError";
    this.message = message || "Validation Error";
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
  constructor({ cause, message, action, statusCode } = {}) {
    super("Unauthorized Error", { cause });
    this.name = "UnauthorizedError";
    this.message = message || "Usuário não autenticado.";
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
  constructor({ cause, message, action, statusCode } = {}) {
    super("Forbidden Error", { cause });
    this.name = "ForbiddenError";
    this.message = message || "Você não tem permissão para realizar esta ação.";
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
  ServiceServerError,
  UnauthorizedError,
  ValidationError,
};
