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
