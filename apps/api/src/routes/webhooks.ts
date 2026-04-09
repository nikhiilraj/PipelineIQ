import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'node:crypto';
import { getWebhookQueue } from '../lib/queues.js';

const HANDLED_EVENTS = new Set([
  'workflow_run',
  'workflow_job',
  'pull_request',
  'push',
  'installation',
  'installation_repositories',
]);

function verifySignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature?.startsWith('sha256=')) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody, 'utf-8');
  const digest = `sha256=${hmac.digest('hex')}`;
  if (digest.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/github', async (req: FastifyRequest, reply: FastifyReply) => {
    const event = req.headers['x-github-event'] as string | undefined;
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const deliveryId = req.headers['x-github-delivery'] as string | undefined;

    const webhookSecret = process.env['GITHUB_WEBHOOK_SECRET'];
    if (!webhookSecret) {
      req.log.error('GITHUB_WEBHOOK_SECRET not configured');
      return reply.code(200).send({ ok: true });
    }

    // Raw body is stored by the content type parser in index.ts
    const rawBody = (req as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(req.body);

    if (!verifySignature(rawBody, signature, webhookSecret)) {
      req.log.warn({ deliveryId, event }, 'Invalid webhook signature — ignoring');
      return reply.code(200).send({ ok: true });
    }

    if (!event || !HANDLED_EVENTS.has(event)) {
      return reply.code(200).send({ ok: true });
    }

    const queue = getWebhookQueue();
    await queue.add(
      event,
      {
        event,
        deliveryId,
        payload: req.body,
        receivedAt: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      }
    );

    req.log.info({ event, deliveryId }, 'Webhook enqueued');
    return reply.code(200).send({ ok: true });
  });
};
