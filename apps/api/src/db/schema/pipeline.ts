import {
  pgTable, uuid, bigint, text, boolean, integer, real, timestamp, index
} from 'drizzle-orm/pg-core';
import { repositories } from './repositories.js';

export const pipelineRuns = pgTable(
  'pipeline_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    repoId: uuid('repo_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
    githubRunId: bigint('github_run_id', { mode: 'number' }).notNull(),
    workflowId: bigint('workflow_id', { mode: 'number' }),
    workflowName: text('workflow_name').notNull(),
    headSha: text('head_sha').notNull(),
    headBranch: text('head_branch'),
    event: text('event'),
    status: text('status'),
    conclusion: text('conclusion'),
    githubCreatedAt: timestamp('github_created_at', { withTimezone: true }).notNull(),
    githubUpdatedAt: timestamp('github_updated_at', { withTimezone: true }),
    runStartedAt: timestamp('run_started_at', { withTimezone: true }),
    runDurationSeconds: integer('run_duration_seconds'),
    isDeployment: boolean('is_deployment').notNull().default(false),
    leadTimeSeconds: integer('lead_time_seconds'),
    recoveryTimeSeconds: integer('recovery_time_seconds'),
    failProbability: real('fail_probability'),
    predictionFeatures: text('prediction_features'), // JSON
    postmortem: text('postmortem'), // JSON
    postmortemGeneratedAt: timestamp('postmortem_generated_at', { withTimezone: true }),
    pullRequestNumber: integer('pull_request_number'),
    pullRequestId: bigint('pull_request_id', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_pipeline_runs_repo_created').on(table.repoId, table.createdAt),
    index('idx_pipeline_runs_github_run_id').on(table.githubRunId),
    index('idx_pipeline_runs_workspace_created').on(table.workspaceId, table.createdAt),
    index('idx_pipeline_runs_is_deployment').on(table.repoId, table.isDeployment, table.createdAt),
  ]
);

export const pipelineJobs = pgTable(
  'pipeline_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id').notNull(),
    workspaceId: uuid('workspace_id').notNull(),
    githubJobId: bigint('github_job_id', { mode: 'number' }).unique().notNull(),
    name: text('name').notNull(),
    status: text('status'),
    conclusion: text('conclusion'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationSeconds: integer('duration_seconds'),
    runnerName: text('runner_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_pipeline_jobs_run_id').on(table.runId),
  ]
);

export const pullRequests = pgTable(
  'pull_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repoId: uuid('repo_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id').notNull(),
    githubPrId: bigint('github_pr_id', { mode: 'number' }).notNull(),
    prNumber: integer('pr_number').notNull(),
    title: text('title'),
    authorLogin: text('author_login').notNull(),
    baseBranch: text('base_branch').notNull(),
    headBranch: text('head_branch').notNull(),
    headSha: text('head_sha'),
    state: text('state'),
    mergedAt: timestamp('merged_at', { withTimezone: true }),
    additions: integer('additions'),
    deletions: integer('deletions'),
    changedFiles: integer('changed_files'),
    filePaths: text('file_paths'), // JSON array
    hasTestFiles: boolean('has_test_files'),
    hasConfigFiles: boolean('has_config_files'),
    hasMigrationFiles: boolean('has_migration_files'),
    prOpenedAt: timestamp('pr_opened_at', { withTimezone: true }).notNull(),
    prClosedAt: timestamp('pr_closed_at', { withTimezone: true }),
    firstCommitAt: timestamp('first_commit_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_pull_requests_repo').on(table.repoId),
  ]
);
