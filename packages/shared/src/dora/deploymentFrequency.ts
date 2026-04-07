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
