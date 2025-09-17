import { FastifyRequest, FastifyReply } from "fastify";

export async function healthCheck(req: FastifyRequest, reply: FastifyReply) {
  return { status: "ok" };
}
