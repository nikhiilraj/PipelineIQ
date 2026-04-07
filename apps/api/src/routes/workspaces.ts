import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/rbac.js';
import { PLAN_LIMITS } from '@pipelineiq/shared/constants';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /workspaces
  fastify.get('/', { preHandler: requireAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const members = await db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, req.user!.userId),
      with: { workspace: true },
    });

    const workspaces = members
      .filter((m) => m.workspace && !m.workspace.deletedAt)
      .map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        plan: m.workspace.plan,
        role: m.role,
        repoLimit: m.workspace.repoLimit,
        mlPredictionsEnabled: m.workspace.mlPredictionsEnabled,
        postmortemsEnabled: m.workspace.postmortemsEnabled,
        createdAt: m.workspace.createdAt.toISOString(),
      }));

    return reply.send({ success: true, data: { workspaces } });
  });

  // POST /workspaces
  fastify.post('/', { preHandler: requireAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createWorkspaceSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: body.error.flatten() },
      });
    }

    const { name, slug } = body.data;

    // Check slug availability
    const existing = await db.query.workspaces.findFirst({
      where: eq(schema.workspaces.slug, slug),
    });

    if (existing) {
      return reply.code(409).send({
        success: false,
        error: { code: 'SLUG_TAKEN', message: 'This workspace URL is already taken' },
      });
    }

    const planLimits = PLAN_LIMITS['free'];

    const [workspace] = await db
      .insert(schema.workspaces)
      .values({
        name,
        slug,
        ownerId: req.user!.userId,
        plan: 'free',
        repoLimit: planLimits.repoLimit,
        historyRetentionDays: planLimits.historyRetentionDays,
        mlPredictionsEnabled: planLimits.mlPredictionsEnabled,
        postmortemsEnabled: planLimits.postmortemsEnabled,
      })
      .returning();

    if (!workspace) {
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create workspace' } });
    }

    // Add owner as member
    await db.insert(schema.workspaceMembers).values({
      workspaceId: workspace.id,
      userId: req.user!.userId,
      role: 'owner',
      acceptedAt: new Date(),
    });

    req.log.info({ workspaceId: workspace.id, userId: req.user!.userId }, 'Workspace created');

    return reply.code(201).send({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          plan: workspace.plan,
          repoLimit: workspace.repoLimit,
          mlPredictionsEnabled: workspace.mlPredictionsEnabled,
          postmortemsEnabled: workspace.postmortemsEnabled,
          createdAt: workspace.createdAt.toISOString(),
        },
      },
    });
  });

  // GET /workspaces/:workspaceId
  fastify.get(
    '/:workspaceId',
    { preHandler: [requireAuth, requireWorkspaceMember('viewer')] },
    async (req: FastifyRequest<{ Params: { workspaceId: string } }>, reply: FastifyReply) => {
      const workspace = await db.query.workspaces.findFirst({
        where: and(
          eq(schema.workspaces.id, req.params.workspaceId),
          isNull(schema.workspaces.deletedAt)
        ),
      });

      if (!workspace) {
        return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
      }

      return reply.send({ success: true, data: { workspace } });
    }
  );

  // GET /workspaces/:workspaceId/members
  fastify.get(
    '/:workspaceId/members',
    { preHandler: [requireAuth, requireWorkspaceMember('viewer')] },
    async (req: FastifyRequest<{ Params: { workspaceId: string } }>, reply: FastifyReply) => {
      const members = await db.query.workspaceMembers.findMany({
        where: eq(schema.workspaceMembers.workspaceId, req.params.workspaceId),
        with: { user: { columns: { id: true, name: true, email: true, avatarUrl: true } } },
      });

      const result = members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        acceptedAt: m.acceptedAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      }));

      return reply.send({ success: true, data: { members: result } });
    }
  );
};
