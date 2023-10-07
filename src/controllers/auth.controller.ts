import argon2 from "argon2";
import parser from "ua-parser-js";
import { Request, Response } from "express";
import mongoose, { ClientSession } from "mongoose";

import UserModel from "../models/user.model";
import TokenModel, { TokenType } from "../models/token.model";

import { BadRequestError } from "../errors/bad-request-error";
import { successfulRequest, redirect, badRequest } from "../helpers/responses";

import {
  sendVerificationEmail,
  sendResetPasswordMail,
  sendWelcomeEmail,
  send2faMail,
} from "../utils/auth.utils";

// GET Request Controllers
const currentUser = async (req: Request, res: Response) => {
  const { _id } = req.user!;

  try {
    const user = await UserModel.findById(_id);
    if (!user) throw new BadRequestError("User not found");

    successfulRequest({
      res,
      message: "Fetched current user",
      data: user,
    });
  } catch (error) {
    throw error;
  }
};

const logout = async (req: Request, res: Response) => {
  const { _id } = req.user!;
  const token = req.token;

  try {
    await UserModel.updateOne({ _id }, { $pull: { tokens: { token } } });

    successfulRequest({
      res,
      message: "User logged out",
      data: {},
    });
  } catch (error) {
    throw error;
  }
};

const resendVerificationEmail = async (req: Request, res: Response) => {
  const { resendToken } = req.query;

  try {
    const token = await TokenModel.findOne({
      token: Number(resendToken),
      type: TokenType.RESEND_REQUEST,
    });

    if (!token || !token.userId)
      throw new BadRequestError("Invalid resend token");

    const user = await UserModel.findById(token.userId);
    if (!user) throw new BadRequestError("Could not find User");

    await sendVerificationEmail(user.email);
    successfulRequest({ res, message: "Email Sent" });
  } catch (error) {
    throw error;
  }
};

const resend2faEmail = async (req: Request, res: Response) => {
  const { resendToken } = req.query;
  const { ua } = parser(req.headers["user-agent"]);

  try {
    const token = await TokenModel.findOne({
      token: Number(resendToken),
      type: TokenType.RESEND_REQUEST,
    });

    if (!token || !token.userId)
      throw new BadRequestError("Invalid resend token");

    const user = await UserModel.findById(token.userId);
    if (!user) throw new BadRequestError("Could not find User");

    await send2faMail(user.email, user.firstName, ua);
    successfulRequest({ res, message: "Email Sent" });
  } catch (error) {
    throw error;
  }
};

// POST Request Controllers
const register = async (req: Request, res: Response) => {
  const session: ClientSession = await mongoose.startSession();

  try {
    session.startTransaction();
    const { firstName, lastName, email, password, phoneNumber, businessAlias } =
      req.body;

    const [user] = await UserModel.create(
      [
        {
          firstName,
          lastName,
          email,
          password,
          phoneNumber,
          businessAlias,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    await sendVerificationEmail(email);
    redirect({ res, message: "User Authenticated", data: { user } });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const login = async (req: Request, res: Response) => {
  const { remaining } = req.rateLimit;
  const { ua } = parser(req.headers["user-agent"]);

  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user)
      throw new BadRequestError(
        `Incorrect Email or Password, you have ${remaining} attempts left`
      );

    const _isValidated = await user.validatePassword(password);
    if (!_isValidated)
      throw new BadRequestError(
        `Incorrect Email or Password, you have ${remaining} attempts left`
      );

    const getRQT = async () =>
      await user.generateRequestToken(TokenType.RESEND_REQUEST);

    if (!user.emailVerified) {
      redirect({
        res,
        message: "User not verified",
        data: { user, resendToken: await getRQT() },
      });
      return;
    }

    if (!user.knownDevices.includes(ua)) {
      await send2faMail(email, user.firstName, ua);
      redirect({
        res,
        message: "User Authenticated",
        data: { user, resendToken: await getRQT(), type: "UNKNOWN_DEVICE" },
      });
      return;
    }

    const token = await user.generateAuthToken();
    successfulRequest({
      res,
      message: "User Authenticated",
      data: { user, token },
    });
  } catch (error) {
    throw error;
  }
};

const verifyUserEmail = async (req: Request, res: Response) => {
  const { email, token: _token, is2fa } = req.body;
  const { ua } = parser(req.headers["user-agent"]);

  try {
    const entry = await TokenModel.findOne({
      email,
      token: Number(_token),
      type: is2fa ? TokenType.AUTH_2FA : TokenType.VERIFY_EMAIL,
      expiresAt: { $gt: Date.now() },
    });

    if (!entry || !entry.valid)
      throw new BadRequestError("Invalid or expired verification token");

    const user = await UserModel.findOne({ email });
    if (!user) throw new BadRequestError("User not found");

    const token = await user.generateAuthToken();

    entry.valid = false;
    user.emailVerified = true;
    user.knownDevices.push(ua);

    await Promise.all([entry.save(), user.save()]);
    if (!is2fa) await sendWelcomeEmail(user.email, user.firstName);

    successfulRequest({
      res,
      message: "User Authenticated",
      data: { user, token },
    });
  } catch (error) {
    throw error;
  }
};

// PATCH Request Controllers
const requestResetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user)
      return badRequest({
        res,
        message: `We couldn't find an account linked with your email`,
      });

    const _rand = Math.random().toString(36).substring(8) + Date.now() / 10000;
    const token = _rand.replace(/ ?\d\/\d?|\.\d{1,}/g, "");

    await TokenModel.create({
      userId: user._id,
      type: TokenType.PASSWORD_RESET,
      token,
      expiresAt: Date.now() + 15 * 60 * 1000 /*15 minutes */,
    });

    await sendResetPasswordMail(email, user.firstName, token);

    successfulRequest({
      res,
      message: `A Email has been sent to ${email} to reset your password`,
    });
  } catch (error) {
    throw error;
  }
};

const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  try {
    const isValidToken = await TokenModel.findOne({
      token,
      type: TokenType.PASSWORD_RESET,
      expiresAt: { $gt: Date.now() },
    });

    if (!isValidToken)
      throw new BadRequestError(`Invalid or expired reset token`);

    const hash = await argon2.hash(password);
    await UserModel.updateOne({ _id: isValidToken.userId }, { password: hash });

    successfulRequest({
      res,
      message: `Password Reset`,
    });
  } catch (error) {
    throw error;
  }
};

const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await UserModel.findById(req.user?._id);
    if (!user) throw new BadRequestError(`User does not exist`);

    const _isValidated = await user.validatePassword(oldPassword);
    if (!_isValidated) throw new BadRequestError(`oldPassword is Incorrect`);

    user.password = newPassword;
    await user.save();

    successfulRequest({
      res,
      message: `Password Updated`,
    });
  } catch (error) {
    throw error;
  }
};

export default {
  register,
  currentUser,
  resendVerificationEmail,
  resend2faEmail,
  login,
  logout,
  verifyUserEmail,
  requestResetPassword,
  resetPassword,
  changePassword,
};
