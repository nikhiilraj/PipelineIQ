import type { DORAClassification } from '../types/dora.js';
import {
  DF_THRESHOLDS,
  LT_THRESHOLDS,
  MTTR_THRESHOLDS,
  CFR_THRESHOLDS,
} from '../constants/dora.js';

export function classifyDeploymentFrequency(deploysPerDay: number): DORAClassification {
  if (deploysPerDay > DF_THRESHOLDS.elite) return 'elite';
  if (deploysPerDay > DF_THRESHOLDS.high) return 'high';
  if (deploysPerDay > DF_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function classifyLeadTime(leadTimeSeconds: number): DORAClassification {
  if (leadTimeSeconds < LT_THRESHOLDS.elite) return 'elite';
  if (leadTimeSeconds < LT_THRESHOLDS.high) return 'high';
  if (leadTimeSeconds < LT_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function classifyMTTR(mttrSeconds: number): DORAClassification {
  if (mttrSeconds < MTTR_THRESHOLDS.elite) return 'elite';
  if (mttrSeconds < MTTR_THRESHOLDS.high) return 'high';
  if (mttrSeconds < MTTR_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function classifyChangeFailureRate(cfr: number): DORAClassification {
  if (cfr <= CFR_THRESHOLDS.elite) return 'elite';
  if (cfr <= CFR_THRESHOLDS.high) return 'high';
  if (cfr <= CFR_THRESHOLDS.medium) return 'medium';
  return 'low';
}

const CLASSIFICATION_RANK: Record<DORAClassification, number> = {
  elite: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function computeOverallClassification(
  classes: (DORAClassification | null)[]
): DORAClassification | null {
  const valid = classes.filter((c): c is DORAClassification => c !== null);
  if (valid.length === 0) return null;
  // Overall = worst (minimum rank) of available metrics
  const minRank = Math.min(...valid.map((c) => CLASSIFICATION_RANK[c]));
  return (Object.entries(CLASSIFICATION_RANK).find(([, v]) => v === minRank)?.[0] ??
    null) as DORAClassification | null;
}
