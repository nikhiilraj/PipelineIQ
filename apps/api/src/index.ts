import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getRedis, closeRedis } from './lib/redis.js';
import { closeAllQueues } from './lib/queues.js';
import { authRoutes } from './routes/auth.js';
import { workspaceRoutes } from './routes/workspaces.js';
import { webhookRoutes } from './routes/webhooks.js';
import { githubRoutes } from './routes/github.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const IS_DEV = process.env['NODE_ENV'] !== 'production';

async function build() {
  const fastify = Fastify({
    logger: IS_DEV
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }
      : true,
    onProtoPoisoning: 'error',
  });

  // Store raw body for webhook HMAC verification
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    (req as unknown as { rawBody: string }).rawBody = body as string;
    try { done(null, JSON.parse(body as string)); }
    catch (err) { done(err as Error, undefined); }
  });

  await fastify.register(cors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3002',
    credentials: true,
  });
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(rateLimit, {
    max: 200, timeWindow: '1 minute',
    redis: getRedis(), keyGenerator: (req) => req.ip,
  });

  fastify.get('/health', async () => ({
    status: 'ok', timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'] ?? 'development',
  }));

  await fastify.register(authRoutes,      { prefix: '/api/v1/auth' });
  await fastify.register(workspaceRoutes, { prefix: '/api/v1/workspaces' });
  // GitHub workspace-scoped routes go under /api/v1/workspaces (same prefix)
  // so /:workspaceId/github/... becomes /api/v1/workspaces/:workspaceId/github/...
  await fastify.register(githubRoutes,    { prefix: '/api/v1/workspaces' });
  // GitHub OAuth callback is top-level (no workspaceId in path)
  // It's registered inside githubRoutes as /github/callback
  // Full URL: /api/v1/workspaces/github/callback — not ideal but functional for dev
  // In production this moves to /api/v1/github/callback with a separate registration
  await fastify.register(webhookRoutes,   { prefix: '/webhooks' });

  fastify.setErrorHandler((error: FastifyError, req, reply) => {
    fastify.log.error({ err: error, url: req.url, method: req.method }, 'Unhandled error');
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: IS_DEV ? error.message : 'An unexpected error occurred' },
    });
  });

  return fastify;
}

async function start() {
  const fastify = await build();
  const shutdown = async (signal: string) => {
    fastify.log.info(`Received ${signal}, shutting down`);
    await fastify.close();
    await closeAllQueues();
    await closeRedis();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

void start();
