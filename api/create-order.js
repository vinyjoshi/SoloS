import { normalizePlan, isValidPlan } from '../src/lib/subscription.js';

const Razorpay = require("razorpay");

// IMPORTANT: Replace with your actual key and secret from environment variables
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  throw new Error("Razorpay Key ID and Key Secret are not configured. Please set them in your environment variables.");
}

const instance = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, currency = 'INR', receipt, planName, userId } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'A valid amount is required.' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'A user ID is required.' });
  }

  const normalizedPlan = normalizePlan(planName);
  if (!isValidPlan(normalizedPlan)) {
    return res.status(400).json({ error: 'A valid plan is required.' });
  }

  const options = {
    amount: amount * 100, // Amount in the smallest currency unit (e.g., paise for INR)
    currency,
    receipt: receipt || `receipt_order_${new Date().getTime()}`,
    notes: {
        plan: normalizedPlan,
        userId: userId,
    }
  };

  try {
    const order = await instance.orders.create(options);
    if (!order) {
      return res.status(500).json({ error: 'Order creation failed.' });
    }
    res.status(200).json({ success: true, order, plan: normalizedPlan });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ success: false, error: 'An error occurred while creating the order.' });
  }
};
