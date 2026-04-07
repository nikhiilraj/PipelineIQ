#!/usr/bin/env bash
# =============================================================================
# PipelineIQ — Phase 1, Script 2: Write all source files + install deps
# Run from: inside the pipelineiq/ directory
# Usage: bash ../02_write_source.sh   (or wherever you saved this)
# =============================================================================
set -euo pipefail

echo "============================================="
echo " PipelineIQ — Phase 1: Source Files"
echo "============================================="

# Verify we're in the right directory
if [ ! -f "turbo.json" ]; then
  echo "❌ Run this script from inside the pipelineiq/ directory"
  exit 1
fi

# ===========================================================================
# PACKAGES/SHARED — Types
# ===========================================================================
echo ""
echo "[1/8] Writing packages/shared/src/types..."

cat > packages/shared/src/types/index.ts << 'EOF'
export * from './user.js';
export * from './workspace.js';
export * from './repository.js';
export * from './pipeline.js';
export * from './dora.js';
export * from './auth.js';
EOF

cat > packages/shared/src/types/user.ts << 'EOF'
export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface WorkspaceSummaryDTO {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceMemberRole;
  plan: WorkspacePlan;
}

export type WorkspaceMemberRole = 'owner' | 'admin' | 'viewer';
export type WorkspacePlan = 'free' | 'pro' | 'team';
EOF

cat > packages/shared/src/types/workspace.ts << 'EOF'
import type { WorkspacePlan } from './user.js';

export interface WorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  repoLimit: number;
  mlPredictionsEnabled: boolean;
  postmortemsEnabled: boolean;
  createdAt: string;
}

export interface WorkspaceMemberDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'viewer';
  acceptedAt: string | null;
  createdAt: string;
}
EOF

cat > packages/shared/src/types/repository.ts << 'EOF'
import type { DORAMetricsDTO } from './dora.js';

export interface RepositoryDTO {
  id: string;
  workspaceId: string;
  fullName: string;
  name: string;
  owner: string;
  defaultBranch: string;
  isPrivate: boolean;
  language: string | null;
  deployBranchPattern: string;
  deployWorkflowPattern: string;
  dora: DORAMetricsDTO | null;
  createdAt: string;
}
EOF

cat > packages/shared/src/types/pipeline.ts << 'EOF'
export interface PipelineRunDTO {
  id: string;
  workspaceId: string;
  repoId: string;
  githubRunId: number;
  workflowName: string;
  headSha: string;
  headBranch: string | null;
  event: string | null;
  status: string | null;
  conclusion: PipelineConclusion | null;
  isDeployment: boolean;
  failProbability: number | null;
  leadTimeSeconds: number | null;
  recoveryTimeSeconds: number | null;
  postmortem: PostmortemDTO | null;
  pullRequestNumber: number | null;
  runStartedAt: string | null;
  runDurationSeconds: number | null;
  githubCreatedAt: string;
  createdAt: string;
}

export type PipelineConclusion =
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | 'neutral'
  | 'stale';

export interface PipelineJobDTO {
  id: string;
  runId: string;
  githubJobId: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  createdAt: string;
}

export interface PostmortemDTO {
  rootCause: string;
  affectedComponent: string;
  errorType:
    | 'test_failure'
    | 'build_failure'
    | 'dependency_error'
    | 'timeout'
    | 'config_error'
    | 'infrastructure'
    | 'unknown';
  suggestedFix: string;
  confidence: 'high' | 'medium' | 'low';
  similarToPastFailure: boolean;
}

export interface PredictionFeaturesDTO {
  prDiffAdditions: number;
  prDiffDeletions: number;
  prFilesChanged: number;
  prHasTestFiles: boolean;
  prHasConfigFiles: boolean;
  prHasMigrationFiles: boolean;
  authorHistoricalFailureRate: number;
  authorPrCount90d: number;
  repoFailureRate7d: number;
  hourOfDay: number;
  dayOfWeek: number;
  prAgeHours: number;
}
EOF

cat > packages/shared/src/types/dora.ts << 'EOF'
export type DORAClassification = 'elite' | 'high' | 'medium' | 'low';

export interface DORAMetricsDTO {
  deploymentFrequency: number | null;
  deploymentFrequencyClass: DORAClassification | null;
  leadTimeP50Seconds: number | null;
  leadTimeP75Seconds: number | null;
  leadTimeP95Seconds: number | null;
  leadTimeClass: DORAClassification | null;
  mttrP50Seconds: number | null;
  mttrClass: DORAClassification | null;
  changeFailureRate: number | null;
  changeFailureRateClass: DORAClassification | null;
  overallClass: DORAClassification | null;
  lastComputedAt: string | null;
}

export interface DORASnapshotDTO {
  id: string;
  workspaceId: string;
  repoId: string | null;
  periodStart: string;
  periodEnd: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  deploymentFrequency: number | null;
  leadTimeP50Seconds: number | null;
  leadTimeP75Seconds: number | null;
  leadTimeP95Seconds: number | null;
  mttrP50Seconds: number | null;
  changeFailureRate: number | null;
  totalDeployments: number | null;
  failedDeployments: number | null;
  dfClass: DORAClassification | null;
  ltClass: DORAClassification | null;
  mttrClass: DORAClassification | null;
  cfrClass: DORAClassification | null;
  overallClass: DORAClassification | null;
}
EOF

cat > packages/shared/src/types/auth.ts << 'EOF'
export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: import('./user.js').UserDTO;
}
EOF

echo "   ✅ Types written"

# ===========================================================================
# PACKAGES/SHARED — Constants
# ===========================================================================
echo ""
echo "[2/8] Writing packages/shared/src/constants..."

cat > packages/shared/src/constants/index.ts << 'EOF'
export * from './plans.js';
export * from './dora.js';
export * from './patterns.js';
EOF

cat > packages/shared/src/constants/plans.ts << 'EOF'
export const PLAN_LIMITS = {
  free: {
    repoLimit: 3,
    historyRetentionDays: 30,
    mlPredictionsEnabled: false,
    postmortemsEnabled: true,
    postmortemsMonthlyLimit: 10,
    alertRulesLimit: 1,
    membersLimit: 3,
    slackAlertsEnabled: false,
    apiAccessEnabled: false,
  },
  pro: {
    repoLimit: 20,
    historyRetentionDays: 180,
    mlPredictionsEnabled: true,
    postmortemsEnabled: true,
    postmortemsMonthlyLimit: -1, // unlimited
    alertRulesLimit: 10,
    membersLimit: 10,
    slackAlertsEnabled: true,
    apiAccessEnabled: false,
  },
  team: {
    repoLimit: -1, // unlimited
    historyRetentionDays: 365,
    mlPredictionsEnabled: true,
    postmortemsEnabled: true,
    postmortemsMonthlyLimit: -1,
    alertRulesLimit: -1,
    membersLimit: -1,
    slackAlertsEnabled: true,
    apiAccessEnabled: true,
  },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;
EOF

cat > packages/shared/src/constants/dora.ts << 'EOF'
import type { DORAClassification } from '../types/dora.js';

// Deployment Frequency thresholds (deploys per day)
export const DF_THRESHOLDS = {
  elite: 1,      // > 1 per day
  high: 1 / 7,   // > 1 per week
  medium: 1 / 30, // > 1 per month
} as const;

// Change Lead Time thresholds (seconds)
export const LT_THRESHOLDS = {
  elite: 3600,         // < 1 hour
  high: 86400,         // < 1 day
  medium: 604800,      // < 1 week
} as const;

// MTTR thresholds (seconds)
export const MTTR_THRESHOLDS = {
  elite: 3600,         // < 1 hour
  high: 86400,         // < 1 day
  medium: 604800,      // < 1 week
} as const;

// Change Failure Rate thresholds (0.0 to 1.0)
export const CFR_THRESHOLDS = {
  elite: 0.05,   // < 5%
  high: 0.10,    // < 10%
  medium: 0.15,  // < 15%
} as const;

export const DORA_CLASSIFICATION_COLORS: Record<DORAClassification, string> = {
  elite: '#10b981',  // emerald-500
  high: '#3b82f6',   // blue-500
  medium: '#f59e0b', // amber-500
  low: '#ef4444',    // red-500
};
EOF

cat > packages/shared/src/constants/patterns.ts << 'EOF'
// CI/CD patterns for deploy detection
export const DEFAULT_DEPLOY_BRANCH_PATTERN = 'main|master|production';
export const DEFAULT_DEPLOY_WORKFLOW_PATTERN = '.*deploy.*|.*release.*|.*prod.*';

// File path patterns for ML feature engineering
export const TEST_FILE_PATTERNS = [
  /^test\//,
  /^spec\//,
  /^__tests__\//,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /\.test\.py$/,
  /\.spec\.py$/,
];

export const CONFIG_FILE_PATTERNS = [
  /^\.github\//,
  /^Dockerfile/,
  /\.(yml|yaml)$/,
  /^package\.json$/,
  /^requirements\.txt$/,
  /^pyproject\.toml$/,
  /^Cargo\.toml$/,
  /^go\.mod$/,
];

export const MIGRATION_FILE_PATTERNS = [
  /^migrations\//,
  /\.migration\.(ts|js|sql)$/,
  /^schema\.sql$/,
  /^db\/migrations\//,
];

// Error signal patterns for log parsing
export const ERROR_SIGNAL_PATTERNS = [
  /ERROR/,
  /FAILED/,
  /error:/i,
  /fatal:/i,
  /exit code [^0]/,
  /npm ERR!/,
  /ModuleNotFoundError/,
  /AssertionError/,
  /ENOENT/,
  /ENOMEM/,
];
EOF

echo "   ✅ Constants written"

# ===========================================================================
# PACKAGES/SHARED — DORA computation functions
# ===========================================================================
echo ""
echo "[3/8] Writing packages/shared/src/dora (pure functions)..."

cat > packages/shared/src/dora/index.ts << 'EOF'
export * from './deploymentFrequency.js';
export * from './changeLeadTime.js';
export * from './mttr.js';
export * from './changeFailureRate.js';
export * from './classify.js';
EOF

cat > packages/shared/src/dora/classify.ts << 'EOF'
import type { DORAClassification } from '../types/dora.js';
import {
  DF_THRESHOLDS,
  LT_THRESHOLDS,
  MTTR_THRESHOLDS,
  CFR_THRESHOLDS,
} from '../constants/dora.js';

export function classifyDeploymentFrequency(deploysPerDay: number): DORAClassification {
  if (deploysPerDay > DF_THRESHOLDS.elite) return 'elite';
  if (deploysPerDay > DF_THRESHOLDS.high) return 'high';
  if (deploysPerDay > DF_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function classifyLeadTime(leadTimeSeconds: number): DORAClassification {
  if (leadTimeSeconds < LT_THRESHOLDS.elite) return 'elite';
  if (leadTimeSeconds < LT_THRESHOLDS.high) return 'high';
  if (leadTimeSeconds < LT_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function classifyMTTR(mttrSeconds: number): DORAClassification {
  if (mttrSeconds < MTTR_THRESHOLDS.elite) return 'elite';
  if (mttrSeconds < MTTR_THRESHOLDS.high) return 'high';
  if (mttrSeconds < MTTR_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function classifyChangeFailureRate(cfr: number): DORAClassification {
  if (cfr <= CFR_THRESHOLDS.elite) return 'elite';
  if (cfr <= CFR_THRESHOLDS.high) return 'high';
  if (cfr <= CFR_THRESHOLDS.medium) return 'medium';
  return 'low';
}

const CLASSIFICATION_RANK: Record<DORAClassification, number> = {
  elite: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function computeOverallClassification(
  classes: (DORAClassification | null)[]
): DORAClassification | null {
  const valid = classes.filter((c): c is DORAClassification => c !== null);
  if (valid.length === 0) return null;
  // Overall = worst (minimum rank) of available metrics
  const minRank = Math.min(...valid.map((c) => CLASSIFICATION_RANK[c]));
  return (Object.entries(CLASSIFICATION_RANK).find(([, v]) => v === minRank)?.[0] ??
    null) as DORAClassification | null;
}
EOF

cat > packages/shared/src/dora/deploymentFrequency.ts << 'EOF'
import type { DORAClassification } from '../types/dora.js';
import { classifyDeploymentFrequency } from './classify.js';

export interface PipelineRunForDF {
  id: string;
  isDeployment: boolean;
  conclusion: string | null;
  githubCreatedAt: Date | string;
}

export interface DeploymentFrequencyResult {
  deploysPerDay: number;
  classification: DORAClassification;
  totalDeployments: number;
  windowDays: number;
}

export function computeDeploymentFrequency(
  runs: PipelineRunForDF[],
  windowDays: number
): DeploymentFrequencyResult {
  const deployments = runs.filter(
    (r) => r.isDeployment && r.conclusion === 'success'
  );

  const deploysPerDay = windowDays > 0 ? deployments.length / windowDays : 0;

  return {
    deploysPerDay,
    classification: classifyDeploymentFrequency(deploysPerDay),
    totalDeployments: deployments.length,
    windowDays,
  };
}
EOF

cat > packages/shared/src/dora/changeLeadTime.ts << 'EOF'
import type { DORAClassification } from '../types/dora.js';
import { classifyLeadTime } from './classify.js';

export interface PipelineRunForLT {
  id: string;
  isDeployment: boolean;
  conclusion: string | null;
  leadTimeSeconds: number | null;
}

export interface ChangeLeadTimeResult {
  p50Seconds: number | null;
  p75Seconds: number | null;
  p95Seconds: number | null;
  classification: DORAClassification | null;
  sampleCount: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

export function computeChangeLeadTime(runs: PipelineRunForLT[]): ChangeLeadTimeResult {
  const leadTimes = runs
    .filter((r) => r.isDeployment && r.conclusion === 'success' && r.leadTimeSeconds !== null)
    .map((r) => r.leadTimeSeconds as number)
    .sort((a, b) => a - b);

  if (leadTimes.length === 0) {
    return { p50Seconds: null, p75Seconds: null, p95Seconds: null, classification: null, sampleCount: 0 };
  }

  const p50 = percentile(leadTimes, 50);
  const p75 = percentile(leadTimes, 75);
  const p95 = percentile(leadTimes, 95);

  return {
    p50Seconds: p50,
    p75Seconds: p75,
    p95Seconds: p95,
    classification: classifyLeadTime(p50),
    sampleCount: leadTimes.length,
  };
}
EOF

cat > packages/shared/src/dora/mttr.ts << 'EOF'
import type { DORAClassification } from '../types/dora.js';
import { classifyMTTR } from './classify.js';

export interface PipelineRunForMTTR {
  id: string;
  isDeployment: boolean;
  conclusion: string | null;
  recoveryTimeSeconds: number | null;
}

export interface MTTRResult {
  p50Seconds: number | null;
  classification: DORAClassification | null;
  sampleCount: number;
  hasNoFailures: boolean;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function computeMTTR(runs: PipelineRunForMTTR[]): MTTRResult {
  const failedDeployments = runs.filter(
    (r) => r.isDeployment && r.conclusion === 'failure'
  );

  if (failedDeployments.length === 0) {
    return { p50Seconds: null, classification: null, sampleCount: 0, hasNoFailures: true };
  }

  const recoveryTimes = failedDeployments
    .filter((r) => r.recoveryTimeSeconds !== null)
    .map((r) => r.recoveryTimeSeconds as number)
    .sort((a, b) => a - b);

  if (recoveryTimes.length === 0) {
    return { p50Seconds: null, classification: null, sampleCount: 0, hasNoFailures: false };
  }

  const p50 = median(recoveryTimes);

  return {
    p50Seconds: p50,
    classification: classifyMTTR(p50),
    sampleCount: recoveryTimes.length,
    hasNoFailures: false,
  };
}
EOF

cat > packages/shared/src/dora/changeFailureRate.ts << 'EOF'
import type { DORAClassification } from '../types/dora.js';
import { classifyChangeFailureRate } from './classify.js';

export interface PipelineRunForCFR {
  id: string;
  isDeployment: boolean;
  conclusion: string | null;
}

export interface ChangeFailureRateResult {
  rate: number | null;
  classification: DORAClassification | null;
  totalDeployments: number;
  failedDeployments: number;
}

export function computeChangeFailureRate(runs: PipelineRunForCFR[]): ChangeFailureRateResult {
  const deployments = runs.filter((r) => r.isDeployment);
  const totalDeployments = deployments.length;

  if (totalDeployments === 0) {
    return { rate: null, classification: null, totalDeployments: 0, failedDeployments: 0 };
  }

  const failedDeployments = deployments.filter((r) => r.conclusion === 'failure').length;
  const rate = failedDeployments / totalDeployments;

  return {
    rate,
    classification: classifyChangeFailureRate(rate),
    totalDeployments,
    failedDeployments,
  };
}
EOF

# --- Tests for DORA functions ---
mkdir -p packages/shared/src/dora/__tests__

cat > packages/shared/src/dora/__tests__/deploymentFrequency.test.ts << 'EOF'
import { computeDeploymentFrequency } from '../deploymentFrequency.js';

function mockRun(overrides: { isDeployment?: boolean; conclusion?: string } = {}) {
  return {
    id: Math.random().toString(),
    isDeployment: overrides.isDeployment ?? true,
    conclusion: overrides.conclusion ?? 'success',
    githubCreatedAt: new Date(),
  };
}

describe('computeDeploymentFrequency', () => {
  it('classifies elite: > 1 deploy/day', () => {
    const runs = Array.from({ length: 45 }, () => mockRun());
    const result = computeDeploymentFrequency(runs, 30);
    expect(result.classification).toBe('elite');
    expect(result.deploysPerDay).toBe(1.5);
    expect(result.totalDeployments).toBe(45);
  });

  it('classifies high: between 1/day and 1/week', () => {
    const runs = Array.from({ length: 10 }, () => mockRun());
    const result = computeDeploymentFrequency(runs, 30);
    expect(result.classification).toBe('high');
  });

  it('classifies medium: between 1/week and 1/month', () => {
    const runs = Array.from({ length: 2 }, () => mockRun());
    const result = computeDeploymentFrequency(runs, 30);
    expect(result.classification).toBe('medium');
  });

  it('classifies low: less than 1/month', () => {
    const runs: never[] = [];
    const result = computeDeploymentFrequency(runs, 30);
    expect(result.classification).toBe('low');
    expect(result.totalDeployments).toBe(0);
  });

  it('excludes non-deployment runs', () => {
    const runs = [
      mockRun({ isDeployment: true, conclusion: 'success' }),
      mockRun({ isDeployment: false, conclusion: 'success' }),
      mockRun({ isDeployment: true, conclusion: 'failure' }),
    ];
    const result = computeDeploymentFrequency(runs, 30);
    expect(result.totalDeployments).toBe(1);
  });

  it('returns 0 deploys/day for empty window', () => {
    const result = computeDeploymentFrequency([], 0);
    expect(result.deploysPerDay).toBe(0);
  });
});
EOF

cat > packages/shared/src/dora/__tests__/changeLeadTime.test.ts << 'EOF'
import { computeChangeLeadTime } from '../changeLeadTime.js';

describe('computeChangeLeadTime', () => {
  it('classifies elite: < 1 hour median', () => {
    const runs = [
      { id: '1', isDeployment: true, conclusion: 'success', leadTimeSeconds: 1800 },
      { id: '2', isDeployment: true, conclusion: 'success', leadTimeSeconds: 2400 },
      { id: '3', isDeployment: true, conclusion: 'success', leadTimeSeconds: 3000 },
    ];
    const result = computeChangeLeadTime(runs);
    expect(result.classification).toBe('elite');
    expect(result.p50Seconds).toBe(2400);
    expect(result.sampleCount).toBe(3);
  });

  it('returns null for no deployment runs', () => {
    const result = computeChangeLeadTime([]);
    expect(result.p50Seconds).toBeNull();
    expect(result.classification).toBeNull();
    expect(result.sampleCount).toBe(0);
  });

  it('ignores failed deployments', () => {
    const runs = [
      { id: '1', isDeployment: true, conclusion: 'failure', leadTimeSeconds: 100 },
      { id: '2', isDeployment: true, conclusion: 'success', leadTimeSeconds: 7200 },
    ];
    const result = computeChangeLeadTime(runs);
    expect(result.sampleCount).toBe(1);
    expect(result.classification).toBe('high'); // 7200s = 2 hours
  });
});
EOF

cat > packages/shared/src/dora/__tests__/changeFailureRate.test.ts << 'EOF'
import { computeChangeFailureRate } from '../changeFailureRate.js';

describe('computeChangeFailureRate', () => {
  it('classifies elite: <= 5% failure rate', () => {
    const runs = [
      { id: '1', isDeployment: true, conclusion: 'success' },
      { id: '2', isDeployment: true, conclusion: 'success' },
      { id: '3', isDeployment: true, conclusion: 'success' },
      { id: '4', isDeployment: true, conclusion: 'success' },
      { id: '5', isDeployment: true, conclusion: 'failure' }, // 20%... wait
    ];
    // 1/5 = 20%, which is 'low'
    const result = computeChangeFailureRate(runs);
    expect(result.classification).toBe('low');
    expect(result.rate).toBe(0.2);
  });

  it('classifies elite with 0 failures', () => {
    const runs = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      isDeployment: true,
      conclusion: 'success',
    }));
    const result = computeChangeFailureRate(runs);
    expect(result.classification).toBe('elite');
    expect(result.rate).toBe(0);
  });

  it('returns null rate for no deployments', () => {
    const result = computeChangeFailureRate([]);
    expect(result.rate).toBeNull();
    expect(result.classification).toBeNull();
  });

  it('ignores non-deployment runs', () => {
    const runs = [
      { id: '1', isDeployment: false, conclusion: 'failure' },
      { id: '2', isDeployment: true, conclusion: 'success' },
    ];
    const result = computeChangeFailureRate(runs);
    expect(result.totalDeployments).toBe(1);
    expect(result.failedDeployments).toBe(0);
  });
});
EOF

cat > packages/shared/src/index.ts << 'EOF'
export * from './types/index.js';
export * from './dora/index.js';
export * from './constants/index.js';
EOF

echo "   ✅ DORA functions written"

# ===========================================================================
# APPS/API — Database Schema (Drizzle ORM)
# ===========================================================================
echo ""
echo "[4/8] Writing apps/api/src/db/schema..."

cat > apps/api/src/db/schema/index.ts << 'EOF'
export * from './users.js';
export * from './workspaces.js';
export * from './github.js';
export * from './repositories.js';
export * from './pipeline.js';
export * from './dora.js';
export * from './alerts.js';
export * from './billing.js';
EOF

cat > apps/api/src/db/schema/users.ts << 'EOF'
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
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
EOF

cat > apps/api/src/db/schema/workspaces.ts << 'EOF'
import {
  pgTable, uuid, text, boolean, integer, timestamp, index, unique
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
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
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('viewer'),
    invitedBy: uuid('invited_by').references(() => users.id),
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
    metadata: text('metadata'), // JSON string
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_workspace').on(table.workspaceId, table.createdAt),
  ]
);
EOF

cat > apps/api/src/db/schema/github.ts << 'EOF'
import { pgTable, uuid, bigint, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';

export const githubInstallations = pgTable('github_installations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  installationId: bigint('installation_id', { mode: 'number' }).unique().notNull(),
  accountLogin: text('account_login').notNull(),
  accountType: text('account_type').notNull(),
  accountAvatarUrl: text('account_avatar_url'),
  permissions: text('permissions').notNull().default('{}'), // JSON
  events: text('events').notNull().default('[]'), // JSON array
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
EOF

cat > apps/api/src/db/schema/repositories.ts << 'EOF'
import {
  pgTable, uuid, bigint, text, boolean, integer, real, timestamp, index, unique
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';
import { githubInstallations } from './github.js';

export const repositories = pgTable(
  'repositories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    installationId: uuid('installation_id')
      .notNull()
      .references(() => githubInstallations.id),
    githubRepoId: bigint('github_repo_id', { mode: 'number' }).unique().notNull(),
    fullName: text('full_name').notNull(),
    name: text('name').notNull(),
    owner: text('owner').notNull(),
    defaultBranch: text('default_branch').notNull().default('main'),
    isPrivate: boolean('is_private').notNull().default(false),
    language: text('language'),
    deployBranchPattern: text('deploy_branch_pattern').default('main|master|production'),
    deployWorkflowPattern: text('deploy_workflow_pattern').default('.*deploy.*|.*release.*|.*prod.*'),
    // Cached DORA metrics
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
    repoId: uuid('repo_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
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
EOF

cat > apps/api/src/db/schema/pipeline.ts << 'EOF'
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
EOF

cat > apps/api/src/db/schema/dora.ts << 'EOF'
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
EOF

cat > apps/api/src/db/schema/alerts.ts << 'EOF'
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
EOF

cat > apps/api/src/db/schema/billing.ts << 'EOF'
// Billing is handled via Stripe — most data lives on the workspace record.
// This file is a placeholder for any future billing-specific tables.
export {};
EOF

echo "   ✅ Database schema written"

# ===========================================================================
# APPS/API — DB connection
# ===========================================================================
echo ""
echo "[5/8] Writing apps/api/src/db/index.ts..."

cat > apps/api/src/db/index.ts << 'EOF'
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema/index.js';

if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env['DATABASE_URL']);
export const db = drizzle(sql, { schema });

export type DB = typeof db;
export { schema };
EOF

echo "   ✅ DB connection written"

# ===========================================================================
# APPS/API — Auth service + JWT
# ===========================================================================
echo ""
echo "[6/8] Writing auth service and JWT utilities..."

cat > apps/api/src/lib/jwt.ts << 'EOF'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import crypto from 'node:crypto';

// Access token: 15 minutes
const ACCESS_TOKEN_TTL = 15 * 60; // seconds
// Refresh token: 7 days
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // seconds

function getKeys() {
  const privateKeyPem = process.env['JWT_PRIVATE_KEY'];
  const publicKeyPem = process.env['JWT_PUBLIC_KEY'];

  if (!privateKeyPem || !publicKeyPem) {
    throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set');
  }

  const privateKey = crypto.createPrivateKey(privateKeyPem.replace(/\\n/g, '\n'));
  const publicKey = crypto.createPublicKey(publicKeyPem.replace(/\\n/g, '\n'));

  return { privateKey, publicKey };
}

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp' | 'iss'>): Promise<string> {
  const { privateKey } = getKeys();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setIssuer('pipelineiq')
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(privateKey);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { publicKey } = getKeys();
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: 'pipelineiq',
    algorithms: ['RS256'],
  });
  return payload as AccessTokenPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);
}
EOF

cat > apps/api/src/lib/redis.ts << 'EOF'
import Redis from 'ioredis';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env['REDIS_URL'];
  if (!url) throw new Error('REDIS_URL environment variable is required');

  _redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    enableReadyCheck: true,
  });

  _redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  return _redis;
}

export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}
EOF

cat > apps/api/src/lib/password.ts << 'EOF'
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

// Using scrypt (Node built-in, no extra deps, OWASP-recommended)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedKey] = hash.split(':');
  if (!salt || !storedKey) return false;
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedBuffer = Buffer.from(storedKey, 'hex');
  // Constant-time comparison to prevent timing attacks
  return (
    derivedKey.length === storedBuffer.length &&
    crypto.timingSafeEqual(derivedKey, storedBuffer)
  );
}
EOF

echo "   ✅ Auth utilities written"

# ===========================================================================
# APPS/API — Auth routes
# ===========================================================================

cat > apps/api/src/routes/auth.ts << 'AUTHROUTES'
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
AUTHROUTES

echo "   ✅ Auth routes written"

# ===========================================================================
# APPS/API — Middleware
# ===========================================================================

cat > apps/api/src/middleware/auth.ts << 'EOF'
import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);
    req.user = payload;
  } catch {
    return reply.code(401).send({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' },
    });
  }
}
EOF

cat > apps/api/src/middleware/rbac.ts << 'EOF'
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
EOF

echo "   ✅ Middleware written"

# ===========================================================================
# APPS/API — Workspace routes
# ===========================================================================

cat > apps/api/src/routes/workspaces.ts << 'WSROUTES'
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
WSROUTES

echo "   ✅ Workspace routes written"

# ===========================================================================
# APPS/API — Main Fastify app
# ===========================================================================
echo ""
echo "[7/8] Writing Fastify app entry point..."

cat > apps/api/src/index.ts << 'EOF'
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getRedis, closeRedis } from './lib/redis.js';
import { authRoutes } from './routes/auth.js';
import { workspaceRoutes } from './routes/workspaces.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const IS_DEV = process.env['NODE_ENV'] !== 'production';

async function build() {
  const fastify = Fastify({
    logger: IS_DEV
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }
      : true,
  });

  // --- Plugins ---
  await fastify.register(cors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3002',
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Managed by Caddy in production
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    redis: getRedis(),
    keyGenerator: (req) => req.ip,
  });

  // --- Health check ---
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'],
  }));

  // --- Routes ---
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(workspaceRoutes, { prefix: '/api/v1/workspaces' });

  // --- Error handler ---
  fastify.setErrorHandler((error, req, reply) => {
    fastify.log.error({ err: error, url: req.url, method: req.method }, 'Unhandled error');
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: IS_DEV ? error.message : 'An unexpected error occurred',
      },
    });
  });

  return fastify;
}

async function start() {
  const fastify = await build();

  const shutdown = async (signal: string) => {
    fastify.log.info(`Received ${signal}, shutting down gracefully`);
    await fastify.close();
    await closeRedis();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
EOF

echo "   ✅ Fastify entry point written"

# ===========================================================================
# KEY GENERATION SCRIPT
# ===========================================================================
echo ""
echo "[8/8] Writing utilities..."

mkdir -p apps/api/scripts

cat > apps/api/scripts/generate-keys.mjs << 'EOF'
#!/usr/bin/env node
// Run: node apps/api/scripts/generate-keys.mjs
// Generates RS256 key pair for JWT signing

import crypto from 'node:crypto';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Escape newlines for .env file (single-line format)
const escapedPrivate = privateKey.replace(/\n/g, '\\n');
const escapedPublic = publicKey.replace(/\n/g, '\\n');

console.log('# Add these to your .env file:\n');
console.log(`JWT_PRIVATE_KEY="${escapedPrivate}"`);
console.log('');
console.log(`JWT_PUBLIC_KEY="${escapedPublic}"`);
console.log('');
console.log('# Done! These are RSA-2048 keys using RS256 algorithm.');
EOF

# docker-compose.yml for local dev
cat > docker-compose.yml << 'EOF'
# Local development — Postgres and Redis run locally if you don't have Neon/Upstash yet
# Production uses Neon.tech + Upstash (no local DB in prod)
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pipelineiq
      POSTGRES_USER: pipelineiq
      POSTGRES_PASSWORD: pipelineiq_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass pipelineiq_dev

volumes:
  postgres_data:
EOF

echo "   ✅ Utilities and docker-compose written"

echo ""
echo "============================================="
echo " Source files complete ✅"
echo "============================================="
echo ""
echo " Next: Run 03_install_and_setup.sh"
echo ""