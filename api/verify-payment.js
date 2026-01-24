
const crypto = require("crypto");

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_SECRET) {
  throw new Error("Razorpay Key Secret is not configured. Please set it in your environment variables.");
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { order_id, payment_id, signature } = req.body;

  if (!order_id || !payment_id || !signature) {
    return res.status(400).json({ error: "Missing required payment verification parameters." });
  }

  const body = `${order_id}|${payment_id}`;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === signature;

    if (isAuthentic) {
      // Here, you would typically update your database that the payment was successful.
      // For this example, we'll just return a success response.
      res.status(200).json({ success: true, message: "Payment verified successfully." });
    } else {
      res.status(400).json({ success: false, error: "Invalid signature." });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ success: false, error: "An error occurred during payment verification." });
  }
};
