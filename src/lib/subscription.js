
/**
 * @file Manages subscription plan constants, normalization, and validation.
 * This is the canonical source for subscription plan information.
 */

/**
 * An enum of the available subscription plans.
 * Use this to avoid string literals and ensure consistency.
 * @enum {string}
 */
export const SubscriptionType = {
  FREE: 'free',
  PRO: 'pro',
  LIFETIME: 'lifetime',
};

/**
 * A map of plan weights, used for access control.
 * Higher weights have access to more features.
 * @type {Object<SubscriptionType, number>}
 */
export const PLAN_WEIGHT = {
  [SubscriptionType.FREE]: 0,
  [SubscriptionType.PRO]: 1,
  [SubscriptionType.LIFETIME]: 2,
};

/**
 * Normalizes a plan string to its canonical form.
 * This is a "tolerant" normalization, which attempts to coerce common typos and case variations.
 *
 * @param {string} planName The plan name to normalize.
 * @returns {SubscriptionType | null} The normalized plan name, or null if it cannot be normalized.
 */
export function normalizePlan(planName) {
  if (!planName || typeof planName !== 'string') {
    return null;
  }

  const lowercasedPlan = planName.toLowerCase().trim();
  switch (lowercasedPlan) {
    case 'free':
    case 'basic':
      return SubscriptionType.FREE;
    case 'pro':
    case 'solos pro':
      return SubscriptionType.PRO;
    case 'lifetime':
      return SubscriptionType.LIFETIME;
    default:
      return null;
  }
}

/**
 * Checks if a plan name is valid after normalization.
 *
 * @param {string} planName The plan name to validate.
 * @returns {boolean} True if the plan is valid, false otherwise.
 */
export function isValidPlan(planName) {
  return normalizePlan(planName) !== null;
}

/**
 * Checks if a user has access to pro features based on their plan.
 *
 * @param {object} user - The user object, which should have a `tier` property.
 * @returns {boolean} True if the user has access, false otherwise.
 */
export function hasAccess(user) {
    if (!user || !user.tier) {
        return false;
    }
    const normalizedPlan = normalizePlan(user.tier);
    return normalizedPlan === SubscriptionType.PRO || normalizedPlan === SubscriptionType.LIFETIME;
}
