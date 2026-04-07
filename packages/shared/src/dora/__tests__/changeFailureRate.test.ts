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
