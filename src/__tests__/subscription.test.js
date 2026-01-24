
import { normalizePlan, hasAccess, SubscriptionType } from '../lib/subscription.js';

describe('normalizePlan', () => {
  it('should normalize various plan names to their canonical form', () => {
    expect(normalizePlan('pro')).toBe(SubscriptionType.PRO);
    expect(normalizePlan('solos pro')).toBe(SubscriptionType.PRO);
    expect(normalizePlan('free')).toBe(SubscriptionType.FREE);
    expect(normalizePlan('basic')).toBe(SubscriptionType.FREE);
    expect(normalizePlan('lifetime')).toBe(SubscriptionType.LIFETIME);
  });

  it('should return null for unrecognized plan names', () => {
    expect(normalizePlan('unknown-plan')).toBe(null);
    expect(normalizePlan('pro plan')).toBe(null);
  });

  it('should return null for invalid input', () => {
    expect(normalizePlan(null)).toBe(null);
    expect(normalizePlan(undefined)).toBe(null);
  });
});

describe('hasAccess', () => {
  it('should return true for users with pro or lifetime plans', () => {
    const proUser = { tier: SubscriptionType.PRO };
    const lifetimeUser = { tier: SubscriptionType.LIFETIME };
    const solosProUser = { tier: 'solos pro' }; // Test normalization
    expect(hasAccess(proUser)).toBe(true);
    expect(hasAccess(lifetimeUser)).toBe(true);
    expect(hasAccess(solosProUser)).toBe(true);
  });

  it('should return false for users with a free plan', () => {
    const freeUser = { tier: SubscriptionType.FREE };
    const basicUser = { tier: 'basic' }; // Test normalization
    expect(hasAccess(freeUser)).toBe(false);
    expect(hasAccess(basicUser)).toBe(false);
  });

  it('should return false for users with no plan or an unrecognized plan', () => {
    const noPlanUser = {};
    const unknownPlanUser = { tier: 'some-other-plan' };
    const nullTierUser = { tier: null };
    expect(hasAccess(noPlanUser)).toBe(false);
    expect(hasAccess(unknownPlanUser)).toBe(false);
    expect(hasAccess(nullTierUser)).toBe(false);
  });

  it('should return false for null or undefined user objects', () => {
    expect(hasAccess(null)).toBe(false);
    expect(hasAccess(undefined)).toBe(false);
  });
});
