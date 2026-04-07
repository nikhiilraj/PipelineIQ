import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import crypto from 'node:crypto';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

async function issueTokenPair(userId: string, email: string, req: FastifyRequest) {
  const accessToken = await signAccessToken({ userId, email });
  const rawRefresh = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefresh);

  await db.insert(schema.refreshTokens).values({
    userId,
    tokenHash,
    expiresAt: getRefreshTokenExpiry(),
    userAgent: req.headers['user-agent'] ?? null,
    ipAddress: req.ip ?? null,
  });

  return { accessToken, refreshToken: rawRefresh };
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/register
  fastify.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: body.error.flatten() },
      });
    }

    const { email, password, name } = body.data;

    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
    });

    if (existing) {
      return reply.code(409).send({
        success: false,
        error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
      });
    }

    const passwordHash = await hashPassword(password);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [user] = await db
      .insert(schema.users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        emailVerifyToken,
        emailVerifyTokenExpiresAt,
      })
      .returning({ id: schema.users.id });

    if (!user) {
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' },
      });
    }

    // TODO Phase 7: Send verification email via Resend
    // For now, auto-verify in development
    if (process.env['NODE_ENV'] === 'development') {
      await db
        .update(schema.users)
        .set({ emailVerified: true, emailVerifyToken: null })
        .where(eq(schema.users.id, user.id));
    }

    req.log.info({ userId: user.id }, 'User registered');

    return reply.code(201).send({
      success: true,
      data: { message: 'Account created. Check your email to verify.' },
    });
  });

  // POST /auth/verify-email
  fastify.post('/verify-email', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = verifyEmailSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid token' } });
    }

    const user = await db.query.users.findFirst({
      where: and(
        eq(schema.users.emailVerifyToken, body.data.token),
        gt(schema.users.emailVerifyTokenExpiresAt, new Date())
      ),
    });

    if (!user) {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } });
    }

    await db
      .update(schema.users)
      .set({ emailVerified: true, emailVerifyToken: null, emailVerifyTokenExpiresAt: null })
      .where(eq(schema.users.id, user.id));

    const tokens = await issueTokenPair(user.id, user.email, req);

    return reply.send({
      success: true,
      data: {
        ...tokens,
        expiresIn: 900,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: true,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  });

  // POST /auth/login
  fastify.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email or password format' },
      });
    }

    const { email, password } = body.data;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
    });

    if (!user || !user.passwordHash) {
      // Timing-safe: still do a hash operation to prevent user enumeration via timing
      await hashPassword(password);
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    if (!user.emailVerified) {
      return reply.code(403).send({
        success: false,
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in' },
      });
    }

    // Update last login
    await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));

    const tokens = await issueTokenPair(user.id, user.email, req);
    req.log.info({ userId: user.id }, 'User logged in');

    return reply.send({
      success: true,
      data: {
        ...tokens,
        expiresIn: 900,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  });

  // POST /auth/refresh
  fastify.post('/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = refreshSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' } });
    }

    const tokenHash = hashRefreshToken(body.data.refreshToken);

    const existing = await db.query.refreshTokens.findFirst({
      where: and(
        eq(schema.refreshTokens.tokenHash, tokenHash),
        gt(schema.refreshTokens.expiresAt, new Date()),
        isNull(schema.refreshTokens.revokedAt)
      ),
    });

    if (!existing) {
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired' },
      });
    }

    // Revoke the used token (rotation)
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.id, existing.id));

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, existing.userId) });
    if (!user) {
      return reply.code(401).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    const tokens = await issueTokenPair(user.id, user.email, req);

    return reply.send({
      success: true,
      data: { ...tokens, expiresIn: 900 },
    });
  });

  // POST /auth/logout
  fastify.post('/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = refreshSchema.safeParse(req.body);
    if (body.success) {
      const tokenHash = hashRefreshToken(body.data.refreshToken);
      await db
        .update(schema.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(schema.refreshTokens.tokenHash, tokenHash));
    }
    return reply.send({ success: true, data: {} });
  });

  // GET /auth/me
  fastify.get('/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch {
      return reply.code(401).send({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } });
    }

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, payload.userId) });
    if (!user) {
      return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    const memberRows = await db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, user.id),
      with: { workspace: true },
    });

    const workspaces = memberRows
      .filter((m) => m.workspace && !m.workspace.deletedAt)
      .map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        plan: m.workspace.plan,
      }));

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
        },
        workspaces,
      },
    });
  });
};
