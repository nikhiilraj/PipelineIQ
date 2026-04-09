import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { getGitHubApp } from '../lib/github.js';
import { getRedis } from '../lib/redis.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/rbac.js';

export const githubRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /workspaces/:workspaceId/github/install-url
  fastify.get(
    '/:workspaceId/github/install-url',
    { preHandler: [requireAuth, requireWorkspaceMember('admin')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { workspaceId } = req.params as { workspaceId: string };

      const state = crypto.randomBytes(32).toString('hex');
      const redis = getRedis();
      await redis.set(`github:oauth:state:${state}`, workspaceId, 'EX', 600);

      const installUrl = `https://github.com/apps/pipelineiq-dev/installations/new?state=${state}`;
      return reply.send({ success: true, data: { installUrl } });
    }
  );

  // GET /github/callback
  fastify.get(
    '/github/callback',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = req.query as { installation_id?: string; state?: string; setup_action?: string };
      const { installation_id, state } = query;
      const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3002';

      if (!state || !installation_id) {
        return reply.redirect(`${frontendUrl}/dashboard?error=missing_params`);
      }

      const redis = getRedis();
      const workspaceId = await redis.get(`github:oauth:state:${state}`);
      if (!workspaceId) {
        return reply.redirect(`${frontendUrl}/dashboard?error=invalid_state`);
      }

      await redis.del(`github:oauth:state:${state}`);
      const installationIdNum = parseInt(installation_id, 10);

      try {
        const app = getGitHubApp();
        const { data: installation } = await app.octokit.request(
          'GET /app/installations/{installation_id}',
          { installation_id: installationIdNum }
        );

        // installation.account is User | Organization union — cast to access common fields
        const account = installation.account as {
          login?: string;
          name?: string;
          type?: string;
          avatar_url?: string;
        } | null;

        const accountLogin = account?.login ?? account?.name ?? 'unknown';
        const accountType = account?.type ?? 'User';
        const accountAvatarUrl = account?.avatar_url ?? null;

        const existing = await db.query.githubInstallations.findFirst({
          where: eq(schema.githubInstallations.installationId, installationIdNum),
        });

        if (!existing) {
          await db.insert(schema.githubInstallations).values({
            workspaceId,
            installationId: installationIdNum,
            accountLogin,
            accountType,
            accountAvatarUrl,
            permissions: JSON.stringify(installation.permissions ?? {}),
            events: JSON.stringify(installation.events ?? []),
          });
        } else {
          await db
            .update(schema.githubInstallations)
            .set({ workspaceId, accountLogin, updatedAt: new Date() })
            .where(eq(schema.githubInstallations.installationId, installationIdNum));
        }

        fastify.log.info({ installationId: installationIdNum, workspaceId }, 'GitHub App installed');
        return reply.redirect(`${frontendUrl}/dashboard?github=connected`);
      } catch (err) {
        fastify.log.error({ err }, 'GitHub callback error');
        return reply.redirect(`${frontendUrl}/dashboard?error=github_failed`);
      }
    }
  );

  // GET /workspaces/:workspaceId/github/installations
  fastify.get(
    '/:workspaceId/github/installations',
    { preHandler: [requireAuth, requireWorkspaceMember('viewer')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { workspaceId } = req.params as { workspaceId: string };
      const installations = await db.query.githubInstallations.findMany({
        where: eq(schema.githubInstallations.workspaceId, workspaceId),
      });

      return reply.send({
        success: true,
        data: {
          installations: installations.map((i) => ({
            id: i.id,
            installationId: i.installationId,
            accountLogin: i.accountLogin,
            accountType: i.accountType,
            accountAvatarUrl: i.accountAvatarUrl,
            suspendedAt: i.suspendedAt?.toISOString() ?? null,
            createdAt: i.createdAt.toISOString(),
          })),
        },
      });
    }
  );
};
