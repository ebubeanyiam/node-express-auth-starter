import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status";
import { Request, Response /* NextFunction */ } from "express";
import axios from "axios";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { CustomError } from "../errors/custom-error";

interface MongoServerError {
  code: number;
  keyPattern: { email: number };
}

export const errorHandler = (
  err: Error,
  _: Request,
  res: Response
  // next: NextFunction
) => {
  if (err instanceof TokenExpiredError) {
    return res.status(403).send({
      status: false,
      message: err.message,
      code: 403,
    });
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(403).send({
      status: false,
      message: err.message,
      code: 403,
    });
  }

  if (axios.isAxiosError(err)) {
    return res.status(err.response!.status! || 500).send({
      status: false,
      message: err.response?.data.message || "Something went wrong",
      code: err.response?.status,
    });
  }

  if (err instanceof CustomError) {
    return res.status(err.statusCode).send(err.serializeErrors());
  }

  if (err.name === "MongoServerError") {
    const _err = err as unknown;
    const error = _err as MongoServerError;

    if (error.code === 11000) {
      return res.status(BAD_REQUEST).send({
        status: false,
        message: `${Object.keys(error.keyPattern)[0]
          .charAt(0)
          .toUpperCase()}${Object.keys(error.keyPattern)[0].slice(
          1
        )} already exists`,
        code: BAD_REQUEST,
      });
    }
  }

  res.status(INTERNAL_SERVER_ERROR).send({
    status: false,
    message: err.message || "Something went wrong",
    code: INTERNAL_SERVER_ERROR,
  });
};
