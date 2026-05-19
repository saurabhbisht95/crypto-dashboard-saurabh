import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is missing from environment variables.");
  }

  const connection = await mongoose.connect(env.mongoUri, {
    dbName: "CryptoTrackerBackend",
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
};
