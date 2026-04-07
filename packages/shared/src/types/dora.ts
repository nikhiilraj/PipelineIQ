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
