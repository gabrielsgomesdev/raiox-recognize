import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    sendSseMessage(sessionId: string, msg: string): void;
  }
}