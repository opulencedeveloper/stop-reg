import { Server as HttpServer } from "http";
import app from "./app";
import config from "./config";
import Logging from "./utils/logging";

const startServer = async () => {
  const server: HttpServer = app.listen(config.app.port, () => {
    Logging.info(`${config.app.brandName} Frontend Server is running on port ${config.app.port} 🔥🔧`);
    Logging.info(`Serving static files from: ${config.app.publicDir}`);
  });

  const gracefulShutdown = (signal: string) => {
    Logging.warn(`${signal} signal received: closing HTTP server`);

    server.close(() => {
      Logging.info("HTTP server closed.");
      process.exit(0);
    });

    setTimeout(() => {
      Logging.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

startServer().catch((error) => {
  Logging.error(`CRITICAL FAILURE: ${error.message}`);
  process.exit(1);
});
