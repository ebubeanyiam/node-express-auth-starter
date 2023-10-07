import sgMail from "@sendgrid/mail";
import dayjs from "dayjs";

import TokenModel, { TokenType } from "../models/token.model";

import _2faMail from "../mails/2faMail";
import welcomeMail from "../mails/welcomeMail";
import verifyAccountMail from "../mails/verificationMail";
import resetPasswordMail from "../mails/resetPassword";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendVerificationEmail = async (email: string) => {
  try {
    const expInHr = Date.now() + 60 * 60 * 1000;

    const token = Math.floor(1000 + Math.random() * 9000);
    await TokenModel.create({
      token,
      email,
      expiresAt: expInHr,
      type: TokenType.VERIFY_EMAIL,
    });

    const html = verifyAccountMail(email, token);
    const mail = {
      to: email,
      from: "your-email@your-email-provider.com",
      subject: "Verify your Account",
      text: "Complete your account registration",
      html,
    };

    await sgMail.send(mail);
  } catch (error) {
    throw error;
  }
};
export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const html = welcomeMail(name);
    const mail = {
      to: email,
      from: "your-email@your-email-provider.com",
      subject: "Welcome to re:current",
      text: "We're glad you're here",
      html,
    };

    await sgMail.send(mail);
  } catch (error) {
    throw error;
  }
};

export const sendResetPasswordMail = async (
  email: string,
  name: string,
  token: string
) => {
  try {
    const html = resetPasswordMail(token, name);
    let mail = {
      to: email,
      from: "your-email@your-email-provider.com",
      subject: "Password Reset Request",
      text: "We've received a request to reset your account password",
      html,
    };

    await sgMail.send(mail);
  } catch (error) {
    throw error;
  }
};
export const send2faMail = async (email: string, name: string, ua: string) => {
  try {
    const expInHHr = Date.now() + 30 * 60 * 1000;
    const token = Math.floor(1000 + Math.random() * 900000);
    await TokenModel.create({
      token,
      email,
      expiresAt: expInHHr,
      type: TokenType.AUTH_2FA,
    });

    const when = `${dayjs(Date.now()).format("YYYY-MM-DD HH:mm:ss")} UT`;

    const html = _2faMail(name, when, ua, token);
    let mail = {
      to: email,
      from: "your-email@your-email-provider.com",
      subject: "Your confirmation code",
      text: "There was a sign-in from an unrecognized device",
      html,
    };

    await sgMail.send(mail);
  } catch (error) {
    throw error;
  }
};
