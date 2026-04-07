export const PLAN_LIMITS = {
  free: {
    repoLimit: 3,
    historyRetentionDays: 30,
    mlPredictionsEnabled: false,
    postmortemsEnabled: true,
    postmortemsMonthlyLimit: 10,
    alertRulesLimit: 1,
    membersLimit: 3,
    slackAlertsEnabled: false,
    apiAccessEnabled: false,
  },
  pro: {
    repoLimit: 20,
    historyRetentionDays: 180,
    mlPredictionsEnabled: true,
    postmortemsEnabled: true,
    postmortemsMonthlyLimit: -1, // unlimited
    alertRulesLimit: 10,
    membersLimit: 10,
    slackAlertsEnabled: true,
    apiAccessEnabled: false,
  },
  team: {
    repoLimit: -1, // unlimited
    historyRetentionDays: 365,
    mlPredictionsEnabled: true,
    postmortemsEnabled: true,
    postmortemsMonthlyLimit: -1,
    alertRulesLimit: -1,
    membersLimit: -1,
    slackAlertsEnabled: true,
    apiAccessEnabled: true,
  },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;
