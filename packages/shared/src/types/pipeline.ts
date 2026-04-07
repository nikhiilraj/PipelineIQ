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
