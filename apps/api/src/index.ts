import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getRedis, closeRedis } from './lib/redis.js';
import { authRoutes } from './routes/auth.js';
import { workspaceRoutes } from './routes/workspaces.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const IS_DEV = process.env['NODE_ENV'] !== 'production';

async function build() {
  const fastify = Fastify({
    logger: IS_DEV
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }
      : true,
  });

  // --- Plugins ---
  await fastify.register(cors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3002',
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Managed by Caddy in production
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    redis: getRedis(),
    keyGenerator: (req) => req.ip,
  });

  // --- Health check ---
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'],
  }));

  // --- Routes ---
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(workspaceRoutes, { prefix: '/api/v1/workspaces' });

  // --- Error handler ---
  fastify.setErrorHandler((error, req, reply) => {
    fastify.log.error({ err: error, url: req.url, method: req.method }, 'Unhandled error');
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: IS_DEV ? error.message : 'An unexpected error occurred',
      },
    });
  });

  return fastify;
}

async function start() {
  const fastify = await build();

  const shutdown = async (signal: string) => {
    fastify.log.info(`Received ${signal}, shutting down gracefully`);
    await fastify.close();
    await closeRedis();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
