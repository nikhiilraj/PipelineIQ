import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import type { WorkspaceMemberRole } from '@pipelineiq/shared/types';

const ROLE_RANK: Record<WorkspaceMemberRole, number> = {
  owner: 3,
  admin: 2,
  viewer: 1,
};

export function requireWorkspaceMember(minRole: WorkspaceMemberRole = 'viewer') {
  return async (req: FastifyRequest<{ Params: { workspaceId?: string } }>, reply: FastifyReply): Promise<void> => {
    if (!req.user) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const workspaceId = req.params.workspaceId;
    if (!workspaceId) {
      return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'workspaceId required' } });
    }

    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, req.user.userId)
      ),
    });

    if (!member) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const memberRank = ROLE_RANK[member.role as WorkspaceMemberRole] ?? 0;
    const requiredRank = ROLE_RANK[minRole];

    if (memberRank < requiredRank) {
      return reply.code(403).send({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: `Requires ${minRole} role or higher` },
      });
    }
  };
}
