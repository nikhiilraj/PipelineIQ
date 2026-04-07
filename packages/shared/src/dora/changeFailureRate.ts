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
