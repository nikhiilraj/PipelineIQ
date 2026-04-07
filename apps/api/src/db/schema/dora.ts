import {
  pgTable, uuid, text, integer, real, timestamp, index, unique
} from 'drizzle-orm/pg-core';

export const doraSnapshots = pgTable(
  'dora_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    repoId: uuid('repo_id'),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    periodType: text('period_type').notNull(),
    deploymentFrequency: real('deployment_frequency'),
    leadTimeP50Seconds: integer('lead_time_p50_seconds'),
    leadTimeP75Seconds: integer('lead_time_p75_seconds'),
    leadTimeP95Seconds: integer('lead_time_p95_seconds'),
    mttrP50Seconds: integer('mttr_p50_seconds'),
    changeFailureRate: real('change_failure_rate'),
    totalDeployments: integer('total_deployments'),
    failedDeployments: integer('failed_deployments'),
    totalPrs: integer('total_prs'),
    dfClass: text('df_class'),
    ltClass: text('lt_class'),
    mttrClass: text('mttr_class'),
    cfrClass: text('cfr_class'),
    overallClass: text('overall_class'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_dora_snapshots_repo_period').on(table.repoId, table.periodStart),
    unique('uq_dora_snapshots_repo_period').on(table.repoId, table.periodStart, table.periodType),
  ]
);
