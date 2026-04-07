import {
  pgTable, uuid, bigint, text, boolean, integer, real, timestamp, index, unique
} from 'drizzle-orm/pg-core';

export const repositories = pgTable(
  'repositories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    installationId: uuid('installation_id').notNull(),
    githubRepoId: bigint('github_repo_id', { mode: 'number' }).unique().notNull(),
    fullName: text('full_name').notNull(),
    name: text('name').notNull(),
    owner: text('owner').notNull(),
    defaultBranch: text('default_branch').notNull().default('main'),
    isPrivate: boolean('is_private').notNull().default(false),
    language: text('language'),
    deployBranchPattern: text('deploy_branch_pattern').default('main|master|production'),
    deployWorkflowPattern: text('deploy_workflow_pattern').default('.*deploy.*|.*release.*|.*prod.*'),
    doraDeploymentFrequency30d: real('dora_deployment_frequency_30d'),
    doraLeadTimeP50Seconds: integer('dora_lead_time_p50_seconds'),
    doraMttrP50Seconds: integer('dora_mttr_p50_seconds'),
    doraChangeFailureRate30d: real('dora_change_failure_rate_30d'),
    doraClassification: text('dora_classification'),
    doraLastComputedAt: timestamp('dora_last_computed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_repos_workspace').on(table.workspaceId),
    index('idx_repos_full_name').on(table.fullName),
    unique('uq_workspace_github_repo').on(table.workspaceId, table.githubRepoId),
  ]
);

export const authorStats = pgTable(
  'author_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    repoId: uuid('repo_id').notNull(),
    authorLogin: text('author_login').notNull(),
    totalPrs90d: integer('total_prs_90d').notNull().default(0),
    failedPrs90d: integer('failed_prs_90d').notNull().default(0),
    failureRate90d: real('failure_rate_90d'),
    lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('uq_author_stats_repo_author').on(table.repoId, table.authorLogin),
  ]
);
