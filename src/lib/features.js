
import { PLAN_WEIGHT, normalizePlan } from '../services/paymentService.js';

/**
 * @file Manages feature keys and their minimum required plan weights.
 * This is the canonical source for feature access control.
 */

/**
 * An enum of the available feature keys.
 * Use this to avoid string literals and ensure consistency.
 * @enum {string}
 */
export const FeatureKey = {
  SECOND_BRAIN: 'second_brain',
  ROUTINES: 'routines',
  TIMELINE: 'timeline',
  EXPENSE_TRACKING: 'expense_tracking',
  AREA_PROJECT_MANAGEMENT: 'area_project_management',
};

/**
 * A map of feature keys to their minimum required plan weight.
 * This is the source of truth for hasAccess checks.
 * @type {Object<FeatureKey, number>}
 */
export const FEATURE_MIN_PLAN_WEIGHT = {
  [FeatureKey.SECOND_BRAIN]: PLAN_WEIGHT.pro,
  [FeatureKey.ROUTINES]: PLAN_WEIGHT.pro,
  [FeatureKey.TIMELINE]: PLAN_WEIGHT.pro,
  [FeatureKey.EXPENSE_TRACKING]: PLAN_WEIGHT.pro,
  [FeatureKey.AREA_PROJECT_MANAGEMENT]: PLAN_WEIGHT.pro,
};

/**
 * Normalizes a feature key string to its canonical form.
 * @param {string} key The feature key to normalize.
 * @returns {FeatureKey | null}
 */
export function normalizeFeatureKey(key) {
  if (!key || typeof key !== 'string') {
    return null;
  }
  const lowercasedKey = key.toLowerCase().trim().replace(/ /g, '_');
  if (Object.values(FeatureKey).includes(lowercasedKey)) {
    return lowercasedKey;
  }
  return null;
}

/**
 * Checks if a user has access to a feature based on their plan.
 * @param {SubscriptionType} userPlan The user's current subscription plan.
 * @param {FeatureKey} featureKey The feature being accessed.
 * @returns {boolean}
 */
export function hasAccess(userPlan, featureKey) {
  const normalizedPlan = normalizePlan(userPlan);
  if (!normalizedPlan) {
    return false;
  }

  const normalizedFeature = normalizeFeatureKey(featureKey);
  if (!normalizedFeature) {
    return false;
  }

  const userPlanWeight = PLAN_WEIGHT[normalizedPlan];
  const requiredPlanWeight = FEATURE_MIN_PLAN_WEIGHT[normalizedFeature];

  return userPlanWeight >= requiredPlanWeight;
}
