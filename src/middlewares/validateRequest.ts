import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

import { RequestValidationError } from "../errors/request-validation-error";

export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      const zErr = error as ZodError;

      throw new RequestValidationError(zErr);
    }
  };
