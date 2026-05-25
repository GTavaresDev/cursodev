export class InternalServerError extends Error {
  constructor({ cause }) {
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
