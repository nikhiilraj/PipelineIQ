import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    passwordHash: text('password_hash'),
    name: text('name').notNull(),
    avatarUrl: text('avatar_url'),
    googleId: text('google_id').unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    emailVerifyToken: text('email_verify_token'),
    emailVerifyTokenExpiresAt: timestamp('email_verify_token_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_google_id').on(table.googleId),
  ]
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    tokenHash: text('token_hash').unique().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_refresh_tokens_user').on(table.userId),
    index('idx_refresh_tokens_hash').on(table.tokenHash),
  ]
);
