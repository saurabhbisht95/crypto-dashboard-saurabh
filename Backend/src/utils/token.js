import jwt from "jsonwebtoken";
import { env, isProduction } from "../config/env.js";

const TOKEN_COOKIE_NAME = "cryptotracker_token";

export const signAccessToken = (userId) => {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

export const setAuthCookie = (res, token) => {
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
};

export const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  return bearerToken || req.cookies?.[TOKEN_COOKIE_NAME] || "";
};
