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
