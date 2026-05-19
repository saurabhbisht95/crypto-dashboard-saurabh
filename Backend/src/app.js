import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

app.use("/api/v1", apiRoutes);

app.use(notFound);
app.use(errorHandler);
