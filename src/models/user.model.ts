import {
  getModelForClass,
  modelOptions,
  prop,
  Severity,
  pre,
  DocumentType,
} from "@typegoose/typegoose";
import argon2 from "argon2";
import { sign } from "jsonwebtoken";
import TokenModel, { TokenType } from "./token.model";

const secret = process.env.JWT_SECRET;

class Token {
  @prop({ required: true })
  token: string;
}

@pre<User>("save", async function () {
  if (!this.isModified("password")) return;

  const hash = await argon2.hash(this.password);
  this.password = hash;

  return;
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      transform(_, ret: any) {
        ret.id = ret._id;

        delete ret._id;
        delete ret.password;
        delete ret.tokens;
        delete ret.knownDevices;
      },
      versionKey: false,
    },
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class User {
  @prop({ required: true })
  firstName: string;

  @prop({})
  lastName: string;

  @prop({ required: true, unique: true })
  email: string;

  @prop({ unique: true })
  phoneNumber: string;

  @prop({})
  password: string;

  @prop({ default: null })
  deletedAt: string;

  @prop({ default: false, required: true })
  emailVerified: boolean;

  @prop({ default: false, required: true })
  phoneVerified: boolean;

  @prop({})
  tokens: Token[];

  @prop({})
  knownDevices: string[];

  async validatePassword(this: DocumentType<User>, candidatePassword: string) {
    try {
      return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
      throw error;
    }
  }

  async generateAuthToken(this: DocumentType<User>) {
    try {
      const token = sign(
        {
          _id: this._id,
          email: this.email,
        },
        secret!
      );
      this.tokens.push({ token });
      await this.save();

      return token;
    } catch (error) {
      throw error;
    }
  }

  async generateRequestToken(
    this: DocumentType<User>,
    type: TokenType,
    exp: string | number = Date.now() + 60 * 60 * 1000
  ) {
    try {
      const _raw = Math.floor(1000 + Math.random() * 900000);

      const { token } = await TokenModel.create({
        userId: this._id,
        token: _raw,
        expiresAt: exp,
        type,
      });

      return token;
    } catch (error) {
      throw error;
    }
  }
}

const UserModel = getModelForClass(User);

export default UserModel;
