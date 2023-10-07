import express from "express";
import rateLimit from "express-rate-limit";

import schemas from "../../schemas/auth.schema";
import controllers from "../../controllers/auth.controller";

import { auth } from "../../middlewares/auth";
import { badRequest } from "../../helpers/responses";
import { validateRequest } from "../../middlewares/validateRequest";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  message: "Too many login attempts, please try again after 5 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_, res, __, options) =>
    badRequest({ res, message: options.message }),
});

// GET Requests
router.get("/me", auth, controllers.currentUser);
router.get("/logout", auth, controllers.logout);
router.get("/verify/email/resend", controllers.resendVerificationEmail);
router.get("/verify/2fa/resend", controllers.resend2faEmail);

// POST Requests
router.post(
  "/register",
  validateRequest(schemas.register),
  controllers.register
);
router.post(
  "/login",
  loginLimiter,
  validateRequest(schemas.login),
  controllers.login
);
router.post("/verify/email", controllers.verifyUserEmail);
router.post(
  "/request-reset-password",
  validateRequest(schemas.requestResetPassword),
  controllers.requestResetPassword
);
router.post(
  "/reset-password",
  validateRequest(schemas.resetPassword),
  controllers.resetPassword
);
router.post(
  "/update-password",
  auth,
  validateRequest(schemas.changePassword),
  controllers.changePassword
);

export default router;
