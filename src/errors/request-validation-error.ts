import { CustomError } from "./custom-error";
import { ZodError } from "zod";

export class RequestValidationError extends CustomError {
  statusCode = 400;

  constructor(public error: ZodError) {
    super(`Invalid request`);

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return {
      message: `${this.error.issues[0].message}`,
      code: this.statusCode,
      status: false,
      resource: "Authorization",
    };
  }
}
