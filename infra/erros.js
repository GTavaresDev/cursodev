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

export class MethodNotAllowedError extends Error {
  constructor({ cause } = {}) {
    super("Method Not Allowed", { cause });
    this.name = "MethodNotAllowedError";
    this.message = "Method Not Allowed";
    this.action = "Verifique se o método está correto.";
    this.statusCode = 405;
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
