import { FastifyInstance } from "fastify";
import { uploadImage } from "../controllers/uploadController.js";

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", uploadImage);
}
