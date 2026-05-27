export class InternalServerError extends Error {
  constructor({ cause } = {}) {
    super("Internal Server Error", { cause });
    this.name = "InternalServerError";
    this.message =
      "Entre em contato com o suporte para resolver este problema.";
    this.statusCode = 500;
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

export class ServiceServerError extends Error {
  constructor({ cause, statusCode } = {}) {
    super("Service Server Error", { cause });
    this.name = "ServiceServerError";
    this.message =
      "Entre em contato com o suporte para resolver este problema.";
    this.statusCode = statusCode || 503;
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

export class MethodNotAllowedError extends Error {
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

export class ValidationError extends Error {
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
