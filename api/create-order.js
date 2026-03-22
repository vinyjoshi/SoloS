export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Missing Razorpay credentials');
      return res.status(500).json({ error: 'Payment service not configured' });
    }

    const { amount, planName } = req.body;
    if (!amount) return res.status(400).json({ error: 'Missing amount' });

    const amountInPaise = Math.round(Number(amount) * 100);
    console.log(`💳 Creating order: ₹${amount} (${amountInPaise} paise) - ${planName}`);

    // Use Razorpay REST API directly — no npm package needed
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { plan: planName || 'SolOS Pro' },
      }),
    });

    const order = await response.json();

    if (!response.ok || !order.id) {
      console.error('Razorpay order failed:', order);
      return res.status(500).json({ error: 'Failed to create order', details: order });
    }

    console.log(`✅ Order created: ${order.id}`);
    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Order creation failed' });
  }
}