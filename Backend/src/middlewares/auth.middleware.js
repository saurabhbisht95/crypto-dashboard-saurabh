import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getTokenFromRequest, verifyAccessToken } from "../utils/token.js";
import { User } from "../models/User.model.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    throw new ApiError(401, "Authentication required.");
  }

  const decodedToken = verifyAccessToken(token);
  const user = await User.findById(decodedToken.sub);

  if (!user) {
    throw new ApiError(401, "Invalid authentication session.");
  }

  req.user = user;
  next();
});
