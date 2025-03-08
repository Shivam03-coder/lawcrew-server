import { Response } from "express";
import { app } from "./app";
import { appEnvConfigs } from "./configs";
import { ApiResponse } from "./helpers/server-functions";

(() => {
  try {
    app.get("/", async (_, res: Response) => {
      res.json(
        new ApiResponse(200, "welcome to server dveloped by shivam anand")
      );
    });
    const server = app.listen(appEnvConfigs.PORT, () => {
      console.log(`Server started at http://localhost:${appEnvConfigs.PORT}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("🛑 Server closed");
        process.exit(0);
      });
    };
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
})();
