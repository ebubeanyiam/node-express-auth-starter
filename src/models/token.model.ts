import {
  getModelForClass,
  modelOptions,
  prop,
  Severity,
} from "@typegoose/typegoose";

export enum TokenType {
  AUTH_2FA = "2fa_auth",
  AUTH_REQUEST = "auth_request",
  RESEND_REQUEST = "resend_request",
  VERIFY_EMAIL = "verify_email",
  PASSWORD_RESET = "reset_password",
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Token {
  @prop({})
  email: string;

  @prop({})
  userId: string;

  @prop({ required: true })
  token: number | string;

  @prop({ required: true })
  type: TokenType;

  @prop({ required: true, default: true })
  valid: boolean;

  @prop({})
  expiresAt: string;
}

const TokenModel = getModelForClass(Token);

export default TokenModel;
