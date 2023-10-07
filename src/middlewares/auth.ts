import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import UserModel, { User } from "../models/user.model";
import { NotAuthorizedError } from "../errors/not-authorized-error";

export interface IUser extends User {
  _id: string;
}

export const auth = async (req: Request, _: Response, next: NextFunction) => {
  const headerAuth = req.header("Authorization");

  if (!headerAuth) {
    throw new NotAuthorizedError();
  }

  const token = headerAuth.replace("Bearer ", "");
  const key = process.env.JWT_SECRET;

  try {
    const payload = jwt.verify(token, key!) as JwtPayload;

    const session = await UserModel.findOne({
      _id: payload._id,
      "tokens.token": token,
    });

    if (!session) throw new NotAuthorizedError();

    req.user = payload as IUser;
    req.token = token;
  } catch (err) {
    throw err;
  }

  next();
};
