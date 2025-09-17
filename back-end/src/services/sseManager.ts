import { FastifyReply } from "fastify";

const sessions: Map<string, FastifyReply> = new Map();

export function registerSse(sessionId: string, reply: FastifyReply) {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  reply.raw.write("\n"); // inicializa a conexão
  sessions.set(sessionId, reply);
}

export function sendSseMessage(sessionId: string, message: string) {
  const reply = sessions.get(sessionId);
  if (reply) {
    reply.raw.write(`data: ${message}\n\n`);
  } else {
    console.warn("Session SSE não encontrada:", sessionId);
  }
}

export function closeSse(sessionId: string) {
  const reply = sessions.get(sessionId);
  if (reply) {
    reply.raw.end();
    sessions.delete(sessionId);
  }
}