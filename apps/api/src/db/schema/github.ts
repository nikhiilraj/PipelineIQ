import { pgTable, uuid, bigint, text, timestamp } from 'drizzle-orm/pg-core';

export const githubInstallations = pgTable('github_installations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  installationId: bigint('installation_id', { mode: 'number' }).unique().notNull(),
  accountLogin: text('account_login').notNull(),
  accountType: text('account_type').notNull(),
  accountAvatarUrl: text('account_avatar_url'),
  permissions: text('permissions').notNull().default('{}'),
  events: text('events').notNull().default('[]'),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
