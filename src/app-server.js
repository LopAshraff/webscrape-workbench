import process from "node:process";
import { startAppServer } from "./app-server-core.js";

const requestedPort = Number(process.env.PORT ?? 4173);

if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}

const { server, port } = await startAppServer({
  port: requestedPort,
  fallbackToRandomPort: process.env.PORT === undefined && requestedPort !== 0
});

process.stdout.write(`webscrape UI on http://localhost:${port}\n`);

const shutdown = () => {
  server.close();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
