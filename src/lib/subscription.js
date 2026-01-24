// Canonical subscription types, normalization, plan weights, and policy helpers

export const SubscriptionType = Object.freeze({
  FREE: 'free',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  LIFETIME: 'lifetime'
});

export const PLAN_WEIGHT = Object.freeze({
  [SubscriptionType.FREE]: 0,
  [SubscriptionType.WEEKLY]: 1,
  [SubscriptionType.MONTHLY]: 2,
  [SubscriptionType.LIFETIME]: 3
});

export const normalizePlan = (value) => {
  if (!value || typeof value !== 'string') return null;
  return value.trim().toLowerCase().replace(/\s+/g, '_');
};

export const isValidPlan = (value) => {
  if (!value || typeof value !== 'string') return false;
  const normalized = normalizePlan(value);
  return Object.values(SubscriptionType).includes(normalized);
};

// Policy helpers

// Returns retention window in days (sliding window). Infinity = no cutoff.
export const getHistoryRetentionDays = (plan) => {
  const p = normalizePlan(plan) || SubscriptionType.FREE;
  switch (p) {
    case SubscriptionType.WEEKLY:
    case SubscriptionType.FREE:
      return 7; // last 7 days sliding window
    case SubscriptionType.MONTHLY:
      return 30;
    case SubscriptionType.LIFETIME:
      return Infinity;
    default:
      return 7;
  }
};

// Free: 5 files in SecondBrain; paid plans: unlimited
export const getSecondBrainFileLimit = (plan) => {
  const p = normalizePlan(plan) || SubscriptionType.FREE;
  return p === SubscriptionType.FREE ? 5 : Infinity;
};

// Returns a Date cutoff for history queries, or null for no cutoff
export const getHistoryCutoffDate = (plan, now = new Date()) => {
  const days = getHistoryRetentionDays(plan);
  if (!Number.isFinite(days)) return null;
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
};