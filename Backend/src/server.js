import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { startAlertScheduler } from "./services/alert.service.js";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log(`CryptoTracker API running on port ${env.port}`);
    });

    startAlertScheduler();
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
