import type { DORAClassification } from '../types/dora.js';

// Deployment Frequency thresholds (deploys per day)
export const DF_THRESHOLDS = {
  elite: 1,      // > 1 per day
  high: 1 / 7,   // > 1 per week
  medium: 1 / 30, // > 1 per month
} as const;

// Change Lead Time thresholds (seconds)
export const LT_THRESHOLDS = {
  elite: 3600,         // < 1 hour
  high: 86400,         // < 1 day
  medium: 604800,      // < 1 week
} as const;

// MTTR thresholds (seconds)
export const MTTR_THRESHOLDS = {
  elite: 3600,         // < 1 hour
  high: 86400,         // < 1 day
  medium: 604800,      // < 1 week
} as const;

// Change Failure Rate thresholds (0.0 to 1.0)
export const CFR_THRESHOLDS = {
  elite: 0.05,   // < 5%
  high: 0.10,    // < 10%
  medium: 0.15,  // < 15%
} as const;

export const DORA_CLASSIFICATION_COLORS: Record<DORAClassification, string> = {
  elite: '#10b981',  // emerald-500
  high: '#3b82f6',   // blue-500
  medium: '#f59e0b', // amber-500
  low: '#ef4444',    // red-500
};
