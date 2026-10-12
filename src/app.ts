import express, { NextFunction, Request, Response, Express } from "express";
import path from "path";
import config, { AppEnvironment } from "./config";
import Logging from "./utils/logging";

import { DisposableEmailProvidersRouter } from "./disposable-email-providers/router";
import { SeoRouter } from "./seo/router";

const app: Express = express();

app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", config.app.viewsDir);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  Logging.info(
    `Incoming ==> Method : [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`
  );

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    Logging.info(
      `Outgoing ==> Method : [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}] - status: [${res.statusCode}] - duration: [${duration}ms]`
    );
  });

  next();
});

app.use(express.static(config.app.publicDir, { extensions: ["html"] }));

app.get("/healthcheck", (_req: Request, res: Response) => {
  res.status(200).send("<!DOCTYPE html><html><head><title>Healthcheck</title></head><body><h1>Server is UP 🔥🔧🎂</h1></body></html>");
});

app.use("/", DisposableEmailProvidersRouter);
app.use(SeoRouter);


app.use((_req: Request, res: Response) => {
  Logging.warn(`404 Not Found: ${_req.method} ${_req.url}`);
  res.status(404).sendFile(path.join(config.app.publicDir, "404.html"));
});

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  Logging.error(`Error occurred: ${err.message}`);

  if (config.app.env !== AppEnvironment.PRODUCTION) {
    Logging.error(`Error stack: ${err.stack}`);
  }

  res.status(500).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>500 - Internal Server Error</title>
      <style>body{font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:50px;}</style>
    </head>
    <body>
      <h1>500 - Internal Server Error</h1>
      <p>Something went wrong on our end. Please try again later.</p>
      ${config.app.env !== AppEnvironment.PRODUCTION ? `<pre style="text-align:left;max-width:800px;margin:20px auto;background:#f4f4f4;padding:15px;border-radius:6px;overflow:auto;">${err.stack}</pre>` : ""}
      <a href="/">Return to Home</a>
    </body>
    </html>
  `);
});

export default app;
