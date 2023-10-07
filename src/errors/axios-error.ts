import { AxiosError as AxsError } from "axios";
import { CustomError } from "./custom-error";

interface ApiError {
  code: number;
  message: string;
  status: boolean;
}

export class AxiosError extends CustomError {
  constructor(public error: AxsError) {
    super("An error occurred while processing your request");

    Object.setPrototypeOf(this, AxiosError.prototype);
  }

  statusCode: number = this.error.response!.status || 400;
  errorData: ApiError = this.error.response?.data as ApiError;

  serializeErrors() {
    return {
      message: this.errorData.message || "Something went wrong",
      status: false,
      code: this.error.response!.status,
    };
  }
}
