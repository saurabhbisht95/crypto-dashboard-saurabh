import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  clearAuthCookie,
  setAuthCookie,
  signAccessToken,
} from "../utils/token.js";
import { isValidEmail } from "../utils/validators.js";
import { Alert } from "../models/Alert.model.js";
import { Holding } from "../models/Holding.model.js";
import { User } from "../models/User.model.js";

const sendAuthResponse = (res, user, message) => {
  const token = signAccessToken(user._id.toString());
  setAuthCookie(res, token);

  return res
    .status(200)
    .json(new ApiResponse(200, { user: user.toSafeObject(), token }, message));
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !isValidEmail(email) || !password || password.length < 8) {
    throw new ApiError(400, "Name, valid email, and 8 character password are required.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "An account already exists for this email.");
  }

  const user = await User.create({
    name: name.trim(),
    email,
    password,
  });

  return sendAuthResponse(res, user, "Account created successfully.");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !password) {
    throw new ApiError(400, "Valid email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return sendAuthResponse(res, user, "Logged in successfully.");
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully."));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user.toSafeObject() }));
});

export const demoLogin = asyncHandler(async (req, res) => {
  const demoEmail = "demo@cryptotracker.dev";
  const demoPassword = "DemoUser123!";

  let user = await User.findOne({ email: demoEmail });

  if (!user) {
    user = await User.create({
      name: "Demo Investor",
      email: demoEmail,
      password: demoPassword,
      watchlist: ["bitcoin", "ethereum", "solana", "chainlink", "dogecoin"],
    });
  } else {
    user.watchlist = ["bitcoin", "ethereum", "solana", "chainlink", "dogecoin"];
    await user.save();
  }

  const existingHoldings = await Holding.countDocuments({ user: user._id });

  if (!existingHoldings) {
    await Holding.insertMany([
      {
        user: user._id,
        coinId: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        amount: 0.18,
        averageBuyPrice: 52000,
      },
      {
        user: user._id,
        coinId: "ethereum",
        symbol: "eth",
        name: "Ethereum",
        amount: 2.4,
        averageBuyPrice: 2400,
      },
      {
        user: user._id,
        coinId: "solana",
        symbol: "sol",
        name: "Solana",
        amount: 35,
        averageBuyPrice: 92,
      },
    ]);
  }

  const existingAlerts = await Alert.countDocuments({ user: user._id });

  if (!existingAlerts) {
    await Alert.insertMany([
      {
        user: user._id,
        coinId: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        direction: "above",
        targetPrice: 100000,
      },
      {
        user: user._id,
        coinId: "ethereum",
        symbol: "eth",
        name: "Ethereum",
        direction: "below",
        targetPrice: 1800,
      },
    ]);
  }

  return sendAuthResponse(res, user, "Demo account ready.");
});
