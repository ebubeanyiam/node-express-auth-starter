import { Request, Response } from "express";
import compress from "compression";

export const allowCompression = (req: Request, res: Response) => {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compress.filter(req, res);
};
