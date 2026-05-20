import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const TOKEN_COOKIE_NAME = "cryptotracker_token";
const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: "/",
});

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
    ...getAuthCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, getAuthCookieOptions());
};

export const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  return bearerToken || req.cookies?.[TOKEN_COOKIE_NAME] || "";
};
