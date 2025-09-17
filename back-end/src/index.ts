import { FastifyInstance } from "fastify";
import { uploadRoutes } from "./routes/uploadRoutes.js";
import { searchRoutes } from "./routes/searchRoutes.js";

export async function appRoutes(fastify: FastifyInstance) {
  await uploadRoutes(fastify);
  await searchRoutes(fastify);
}
