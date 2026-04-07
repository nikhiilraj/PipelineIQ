import {
  pgTable, uuid, text, boolean, integer, timestamp, index, unique
} from 'drizzle-orm/pg-core';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  ownerId: uuid('owner_id').notNull(),
  plan: text('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status').default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  repoLimit: integer('repo_limit').notNull().default(3),
  historyRetentionDays: integer('history_retention_days').notNull().default(30),
  mlPredictionsEnabled: boolean('ml_predictions_enabled').notNull().default(false),
  postmortemsEnabled: boolean('postmortems_enabled').notNull().default(false),
  doraEnabled: boolean('dora_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: text('role').notNull().default('viewer'),
    invitedBy: uuid('invited_by'),
    inviteToken: text('invite_token'),
    inviteExpiresAt: timestamp('invite_expires_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('uq_workspace_members').on(table.workspaceId, table.userId),
  ]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id'),
    actorUserId: uuid('actor_user_id'),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: uuid('resource_id'),
    metadata: text('metadata'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_workspace').on(table.workspaceId, table.createdAt),
  ]
);
