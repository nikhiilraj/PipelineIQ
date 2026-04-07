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
