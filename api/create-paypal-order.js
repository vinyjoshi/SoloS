export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not configured');
      return res.status(500).json({ error: 'PayPal not configured' });
    }

    const { amount, description } = req.body;
    if (!amount) return res.status(400).json({ error: 'Missing amount' });

    // Get PayPal access token
    const authResponse = await fetch(`${process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com'}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const authData = await authResponse.json();
    if (!authData.access_token) {
      console.error('Failed to get PayPal token:', authData);
      return res.status(500).json({ error: 'PayPal authentication failed' });
    }

    // Create PayPal order
    const orderResponse = await fetch(`${process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com'}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: String(amount),
          },
          description: description || 'SolOS Pro',
        }],
      }),
    });

    const orderData = await orderResponse.json();
    if (!orderData.id) {
      console.error('Failed to create PayPal order:', orderData);
      return res.status(500).json({ error: 'Failed to create PayPal order' });
    }

    console.log(`✅ PayPal order created: ${orderData.id}`);
    return res.status(200).json({ orderId: orderData.id });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    return res.status(500).json({ error: 'PayPal order creation failed' });
  }
}