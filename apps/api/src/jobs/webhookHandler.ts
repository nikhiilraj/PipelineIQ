import type { Job } from 'bullmq';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { getDoraQueue, getPostmortemQueue, getPredictionQueue } from '../lib/queues.js';

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  default_branch: string;
  private: boolean;
  language: string | null;
}

interface WorkflowRunPayload {
  action: 'completed' | 'requested' | 'in_progress';
  workflow_run: {
    id: number;
    workflow_id: number;
    name: string;
    head_sha: string;
    head_branch: string;
    event: string;
    status: string;
    conclusion: string | null;
    run_started_at: string;
    created_at: string;
    updated_at: string;
    pull_requests: Array<{ number: number; id: number }>;
    run_duration_ms?: number;
  };
  repository: GitHubRepo;
  installation?: { id: number };
}

interface PullRequestPayload {
  action: 'opened' | 'synchronize' | 'closed' | 'reopened';
  pull_request: {
    id: number;
    number: number;
    title: string;
    state: string;
    user: { login: string };
    head: { sha: string; ref: string };
    base: { ref: string };
    additions: number;
    deletions: number;
    changed_files: number;
    merged_at: string | null;
    created_at: string;
    closed_at: string | null;
  };
  repository: GitHubRepo;
  installation?: { id: number };
}

interface InstallationPayload {
  action: 'created' | 'deleted' | 'suspend' | 'unsuspend';
  installation: {
    id: number;
    account: { login: string; type: string; avatar_url?: string };
  };
}

interface RepoContext {
  id: string;
  workspaceId: string;
  deployBranchPattern: string;
  deployWorkflowPattern: string;
}

const DEFAULT_DEPLOY_BRANCH = 'main|master|production';
const DEFAULT_DEPLOY_WORKFLOW = '.*deploy.*|.*release.*|.*prod.*';

async function findOrCreateRepo(
  githubRepo: GitHubRepo,
  installationId: number
): Promise<RepoContext | null> {
  const installation = await db.query.githubInstallations.findFirst({
    where: eq(schema.githubInstallations.installationId, installationId),
  });
  if (!installation) return null;

  const existing = await db.query.repositories.findFirst({
    where: eq(schema.repositories.githubRepoId, githubRepo.id),
  });

  if (existing) {
    return {
      id: existing.id,
      workspaceId: existing.workspaceId,
      deployBranchPattern: existing.deployBranchPattern ?? DEFAULT_DEPLOY_BRANCH,
      deployWorkflowPattern: existing.deployWorkflowPattern ?? DEFAULT_DEPLOY_WORKFLOW,
    };
  }

  const [inserted] = await db
    .insert(schema.repositories)
    .values({
      workspaceId: installation.workspaceId,
      installationId: installation.id,
      githubRepoId: githubRepo.id,
      fullName: githubRepo.full_name,
      name: githubRepo.name,
      owner: githubRepo.owner.login,
      defaultBranch: githubRepo.default_branch,
      isPrivate: githubRepo.private,
      language: githubRepo.language,
    })
    .returning({ id: schema.repositories.id, workspaceId: schema.repositories.workspaceId });

  if (!inserted) return null;

  // Return with defaults since we just created with null patterns
  return {
    id: inserted.id,
    workspaceId: inserted.workspaceId,
    deployBranchPattern: DEFAULT_DEPLOY_BRANCH,
    deployWorkflowPattern: DEFAULT_DEPLOY_WORKFLOW,
  };
}

function isDeploymentRun(
  workflowName: string,
  branch: string,
  deployBranchPattern: string,
  deployWorkflowPattern: string
): boolean {
  try {
    return (
      new RegExp(deployBranchPattern, 'i').test(branch) &&
      new RegExp(deployWorkflowPattern, 'i').test(workflowName)
    );
  } catch {
    return false;
  }
}

function classifyFiles(filePaths: string[]): {
  hasTestFiles: boolean;
  hasConfigFiles: boolean;
  hasMigrationFiles: boolean;
} {
  const test = [/^test\//, /^spec\//, /^__tests__\//, /\.test\.[tj]sx?$/, /\.spec\.[tj]sx?$/];
  const config = [/^\.github\//, /^Dockerfile/, /\.(yml|yaml)$/, /^package\.json$/, /^requirements\.txt$/];
  const migration = [/^migrations\//, /\.migration\.[tj]s$/, /^schema\.sql$/];
  return {
    hasTestFiles: filePaths.some((f) => test.some((p) => p.test(f))),
    hasConfigFiles: filePaths.some((f) => config.some((p) => p.test(f))),
    hasMigrationFiles: filePaths.some((f) => migration.some((p) => p.test(f))),
  };
}

export async function handleWebhookJob(job: Job): Promise<void> {
  const { event, payload } = job.data as { event: string; payload: unknown; deliveryId: string };

  switch (event) {
    case 'workflow_run':
      await handleWorkflowRun(payload as WorkflowRunPayload);
      break;
    case 'pull_request':
      await handlePullRequest(payload as PullRequestPayload);
      break;
    case 'installation':
      await handleInstallation(payload as InstallationPayload);
      break;
    default:
      break;
  }
}

async function handleWorkflowRun(payload: WorkflowRunPayload): Promise<void> {
  if (payload.action !== 'completed') return;

  const run = payload.workflow_run;
  const installationId = payload.installation?.id;
  if (!installationId) return;

  const repo = await findOrCreateRepo(payload.repository, installationId);
  if (!repo) return;

  const isDeployment = isDeploymentRun(
    run.name,
    run.head_branch ?? '',
    repo.deployBranchPattern,
    repo.deployWorkflowPattern
  );

  const durationSeconds = run.run_duration_ms ? Math.floor(run.run_duration_ms / 1000) : null;

  const existing = await db.query.pipelineRuns.findFirst({
    where: eq(schema.pipelineRuns.githubRunId, run.id),
  });

  let runId: string;

  if (existing) {
    await db
      .update(schema.pipelineRuns)
      .set({ status: run.status, conclusion: run.conclusion, githubUpdatedAt: new Date(run.updated_at), runDurationSeconds: durationSeconds })
      .where(eq(schema.pipelineRuns.githubRunId, run.id));
    runId = existing.id;
  } else {
    const [inserted] = await db
      .insert(schema.pipelineRuns)
      .values({
        workspaceId: repo.workspaceId,
        repoId: repo.id,
        githubRunId: run.id,
        workflowId: run.workflow_id,
        workflowName: run.name,
        headSha: run.head_sha,
        headBranch: run.head_branch,
        event: run.event,
        status: run.status,
        conclusion: run.conclusion,
        githubCreatedAt: new Date(run.created_at),
        githubUpdatedAt: new Date(run.updated_at),
        runStartedAt: run.run_started_at ? new Date(run.run_started_at) : null,
        runDurationSeconds: durationSeconds,
        isDeployment,
        pullRequestNumber: run.pull_requests[0]?.number ?? null,
        pullRequestId: run.pull_requests[0]?.id ?? null,
      })
      .returning({ id: schema.pipelineRuns.id });
    if (!inserted) return;
    runId = inserted.id;
  }

  if (isDeployment && run.conclusion === 'success') {
    await resolveOpenMTTR(repo.id, run.head_branch, new Date(run.created_at));
  }

  // Enqueue DORA compute (debounced — same jobId within 15-min window = deduped)
  const dedupeWindow = Math.floor(Date.now() / (15 * 60 * 1000));
  await getDoraQueue().add(
    'compute',
    { repoId: repo.id, workspaceId: repo.workspaceId },
    {
      jobId: `dora-compute-${repo.id}-${dedupeWindow}`,
      delay: 5000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    }
  );

  if (run.conclusion === 'failure') {
    await getPostmortemQueue().add(
      'generate',
      {
        runId,
        githubRunId: run.id,
        repoId: repo.id,
        workspaceId: repo.workspaceId,
        repoFullName: payload.repository.full_name,
        workflowName: run.name,
        headBranch: run.head_branch,
        installationId,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );
  }
}

async function resolveOpenMTTR(repoId: string, branch: string, recoveredAt: Date): Promise<void> {
  const failedRun = await db.query.pipelineRuns.findFirst({
    where: and(
      eq(schema.pipelineRuns.repoId, repoId),
      eq(schema.pipelineRuns.isDeployment, true),
      eq(schema.pipelineRuns.conclusion, 'failure'),
      eq(schema.pipelineRuns.headBranch, branch)
    ),
  });

  if (!failedRun || failedRun.recoveryTimeSeconds !== null) return;

  const recoverySeconds = Math.floor(
    (recoveredAt.getTime() - failedRun.githubCreatedAt.getTime()) / 1000
  );

  if (recoverySeconds > 7 * 24 * 3600) return;

  await db
    .update(schema.pipelineRuns)
    .set({ recoveryTimeSeconds: recoverySeconds })
    .where(eq(schema.pipelineRuns.id, failedRun.id));
}

async function handlePullRequest(payload: PullRequestPayload): Promise<void> {
  if (!['opened', 'synchronize', 'reopened'].includes(payload.action)) return;

  const pr = payload.pull_request;
  const installationId = payload.installation?.id;
  if (!installationId) return;

  const repo = await findOrCreateRepo(payload.repository, installationId);
  if (!repo) return;

  const fileClassification = classifyFiles([]);

  await db
    .insert(schema.pullRequests)
    .values({
      repoId: repo.id,
      workspaceId: repo.workspaceId,
      githubPrId: pr.id,
      prNumber: pr.number,
      title: pr.title,
      authorLogin: pr.user.login,
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      headSha: pr.head.sha,
      state: pr.state,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      hasTestFiles: fileClassification.hasTestFiles,
      hasConfigFiles: fileClassification.hasConfigFiles,
      hasMigrationFiles: fileClassification.hasMigrationFiles,
      prOpenedAt: new Date(pr.created_at),
    })
    .onConflictDoNothing();

  await getPredictionQueue().add(
    'score',
    {
      prId: pr.id,
      prNumber: pr.number,
      repoId: repo.id,
      workspaceId: repo.workspaceId,
      authorLogin: pr.user.login,
      headSha: pr.head.sha,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      installationId,
    },
    { attempts: 2, backoff: { type: 'exponential', delay: 2000 } }
  );
}

async function handleInstallation(payload: InstallationPayload): Promise<void> {
  const { action, installation } = payload;
  if (action === 'deleted' || action === 'suspend') {
    await db
      .update(schema.githubInstallations)
      .set({ suspendedAt: new Date() })
      .where(eq(schema.githubInstallations.installationId, installation.id));
  } else if (action === 'unsuspend') {
    await db
      .update(schema.githubInstallations)
      .set({ suspendedAt: null })
      .where(eq(schema.githubInstallations.installationId, installation.id));
  }
}
