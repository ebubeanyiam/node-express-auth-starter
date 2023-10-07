import { z } from "zod";
import validator from "validator";

const register = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required!" })
      .email("Invalid email"),
    firstName: z.string({
      required_error: "First name is required",
      invalid_type_error: "First name must be a string",
    }),
    lastName: z.string({
      required_error: "First name is required",
      invalid_type_error: "First name must be a string",
    }),
    phoneNumber: z
      .string({ required_error: "Phone Number is required" })
      .refine((value) => {
        return validator.isMobilePhone(value, ["en-NG"]);
      }, "Please use a valid Nigerian phone number"),
    password: z
      .string({
        required_error: "Password is required",
      })
      .refine(
        (value) =>
          /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/.test(
            value
          ),
        `Password must contain at least 8 characters, 
            include at least one uppercase letter, 
            one lowercase letter, a number, and one special character`
      ),
  }),
});

const login = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email" }),
  }),
});

const requestResetPassword = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email" }),
  }),
});

const resetPassword = z.object({
  body: z.object({
    token: z.string({
      required_error: "Token is required",
      invalid_type_error: "Token must be a string",
    }),
    password: z
      .string({
        required_error: "newPassword is required",
      })
      .refine(
        (value) =>
          /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/.test(
            value
          ),
        `Password must contain at least 8 characters,
        include at least one uppercase letter,
        one lowercase letter, a number, and one special character`
      ),
  }),
});

const changePassword = z.object({
  body: z
    .object({
      newPassword: z
        .string({
          required_error: "newPassword is required",
        })
        .refine(
          (value) =>
            /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/.test(
              value
            ),
          `Password must contain at least 8 characters,
            include at least one uppercase letter,
            one lowercase letter, a number, and one special character`
        ),
      confirmNewPassword: z.string(),
      oldPassword: z.string(),
    })
    .refine(({ newPassword, oldPassword }) => newPassword !== oldPassword, {
      message: "newPassword must not be same as old password",
      path: ["newPassword"],
    })
    .refine(
      ({ newPassword, confirmNewPassword }) =>
        newPassword === confirmNewPassword,
      {
        message: "newPassword and confirmNewPassword must match",
        path: ["confirmNewPassword"],
      }
    ),
});

export default {
  login,
  register,
  resetPassword,
  changePassword,
  requestResetPassword,
};
