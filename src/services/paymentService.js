
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const verifyPayPalSubscription = async (subscriptionId, db, user) => {
  if (!subscriptionId) {
    throw new Error("No subscription ID provided. Cannot verify the transaction.");
  }

  const response = await fetch('/api/verify-paypal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscriptionId }),
  });

  const verificationData = await response.json();

  if (verificationData.status !== 'success') {
    throw new Error(verificationData.message || "The PayPal transaction could not be verified. Please contact support.");
  }

  return verificationData;
};

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
 * @param {object} user - The user object, which should have a 'tier' property.
 * @returns {boolean} True if the user has access, false otherwise.
 */
export function hasAccess(user) {
    if (!user || !user.tier) {
        return false;
    }
    const normalizedPlan = normalizePlan(user.tier);
    return normalizedPlan === SubscriptionType.PRO || normalizedPlan === SubscriptionType.LIFETIME;
}

/**
 * Handles the Razorpay payment flow.
 * @param {object} user The user object from Firebase Auth.
 * @param {number} amount The amount in INR (e.g., 99, 499).
 * @param {string} description A brief description of the purchase.
 * @param {function} onsuccess Callback function for successful payment.
 * @returns {Promise<object>} A promise that resolves with the payment response on success.
 */
export function handleRazorpayPayment(user, amount, description, onsuccess) {
  return new Promise((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount * 100, // Razorpay expects amount in the smallest currency unit
      currency: "INR",
      name: "SolOS Pro",
      description: description,
      image: "/SolOS.png",
      handler: function (response) {
        onsuccess(response);
        resolve(response);
      },
      prefill: {
        name: user.displayName || "",
        email: user.email || "",
      },
      theme: {
        color: "#10b981", // Emerald-500
      },
      modal: {
        ondismiss: function () {
          console.log("Razorpay modal dismissed.");
          reject(new Error("Payment modal dismissed."));
        },
      },
    };
    
    if (!window.Razorpay) {
      alert("Could not connect to payment gateway. Please try again later.");
      return reject(new Error("Razorpay script not loaded."));
    }

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error initializing Razorpay:", error);
      alert("An error occurred while setting up payment. Please try again.");
      reject(error);
    }
  });
}
