import { Jwt } from "jsonwebtoken";

import { IUser } from "../../middlewares/auth";

declare global {
  namespace Express {
    interface Request {
      user: IUser;
      token: Jwt | string;
      rateLimit: RateLimit;
    }
  }
}

interface RateLimit {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}
