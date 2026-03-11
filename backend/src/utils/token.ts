import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload: jwt.JwtPayload | Record<string, unknown>) {
  return jwt.sign(payload, env.accessSecret as jwt.Secret, {
    expiresIn: env.accessExpiresIn as jwt.SignOptions["expiresIn"]
  });
}

export function signRefreshToken(payload: jwt.JwtPayload | Record<string, unknown>) {
  return jwt.sign(payload, env.refreshSecret as jwt.Secret, {
    expiresIn: env.refreshExpiresIn as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.accessSecret as jwt.Secret);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.refreshSecret as jwt.Secret);
}

