import express from "express";
import next from "next";

import { corsMiddleware, createApiRouter, errorHandler } from "./api.js";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);
const nextApp = next({ dev, dir: process.cwd() });
const handle = nextApp.getRequestHandler();

async function main() {
  await nextApp.prepare();

  const app = express();
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(createApiRouter());
  app.use(errorHandler);
  app.use((request, response) => {
    void handle(request, response);
  });

  app.listen(port, () => {
    console.log(`BillAudit unified Next + Express server listening on http://localhost:${port}`);
  });
}

void main();
