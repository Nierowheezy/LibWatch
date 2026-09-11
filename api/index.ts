import { createApp } from "../app.js";
import type express from "express";

let appPromise: Promise<express.Express> | undefined;

export default async function handler(req: express.Request, res: express.Response) {
  if (!appPromise) {
    appPromise = createApp();
  }
  const app = await appPromise;
  return app(req, res);
}