import { FastifyInstance } from "fastify";
import { searchImages } from "../controllers/searchController.js";

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.post("/buscar-similares", searchImages);
}
