import {
  pgTable, uuid, text, boolean, real, timestamp
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';
import { repositories } from './repositories.js';

export const alertRules = pgTable('alert_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  repoId: uuid('repo_id').references(() => repositories.id),
  name: text('name').notNull(),
  metric: text('metric').notNull(),
  condition: text('condition').notNull(),
  thresholdValue: real('threshold_value'),
  thresholdClass: text('threshold_class'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const alertChannels = pgTable('alert_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  config: text('config').notNull(), // JSON (encrypted at app layer)
  isActive: boolean('is_active').notNull().default(true),
  lastTestStatus: text('last_test_status').default('never'),
  lastTestedAt: timestamp('last_tested_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
