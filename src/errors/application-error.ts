import { CustomError } from "./custom-error";

export class ApplicationError extends CustomError {
  statusCode: number = 500;
  message = "An error occurred while processing your request";

  constructor() {
    super("An error occurred while processing your request");

    Object.setPrototypeOf(this, ApplicationError.prototype);
  }

  serializeErrors() {
    return { message: this.message, status: false, code: this.statusCode };
  }
}
