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
