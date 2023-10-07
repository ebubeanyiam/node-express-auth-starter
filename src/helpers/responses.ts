import status from "http-status";
import { Response } from "express";

interface Args {
  res: Response;
  message: string;
  data?: any;
  error?: any;
}

export const successfulRequest = ({ res, message, data }: Args) => {
  res.status(status.OK).send({
    status: true,
    message,
    data,
    code: status.OK,
  });
};

export const resourceCreated = ({ res, message, data }: Args) => {
  res.status(status.CREATED).send({
    status: true,
    message,
    data,
    code: status.CREATED,
  });
};

export const badRequest = ({ res, message, error }: Args) => {
  res.status(status.BAD_REQUEST).send({
    status: false,
    message,
    error,
    code: status.BAD_REQUEST,
  });
};

export const notFound = ({ res, message }: Args) => {
  res.status(status.NOT_FOUND).send({
    status: false,
    message,
    data: null,
    code: status.NOT_FOUND,
  });
};

export const notAllowed = ({ res, message, error }: Args) => {
  res.status(status.METHOD_NOT_ALLOWED).send({
    status: false,
    message,
    error,
    code: status.METHOD_NOT_ALLOWED,
  });
};

export const redirect = ({ res, message, data }: Args) => {
  res.status(status.TEMPORARY_REDIRECT).send({
    status: true,
    message,
    data,
    code: status.TEMPORARY_REDIRECT,
  });
};

const response = {
  successfulRequest,
  badRequest,
  notAllowed,
  resourceCreated,
  notFound,
  redirect,
};

export default response;
