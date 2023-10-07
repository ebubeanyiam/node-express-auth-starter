export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, CustomError.prototype);
  }

  abstract serializeErrors(): {
    message: string;
    field?: string;
    status: boolean;
    code: number;
    issues?: Issues;
    resource?: string;
  };
}

interface Issues {
  code: string;
  expected: string;
  received: string;
}
