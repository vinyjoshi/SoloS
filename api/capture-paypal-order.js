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
      return res.status(500).json({ error: 'PayPal not configured' });
    }

    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

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
      return res.status(500).json({ error: 'PayPal authentication failed' });
    }

    // Capture the order
    const captureResponse = await fetch(
      `${process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com'}/v2/checkout/orders/${orderId}/capture`,  {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.access_token}`,
        },
      }
    );

    const captureData = await captureResponse.json();

    if (captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return res.status(400).json({ error: 'Payment capture failed', details: captureData });
    }

    const capture = captureData.purchase_units[0].payments.captures[0];
    console.log(`✅ PayPal payment captured: ${capture.id}`);

    return res.status(200).json({
      success: true,
      paymentId: capture.id,
      orderId: captureData.id,
      status: captureData.status,
    });

  } catch (error) {
    console.error('PayPal capture error:', error);
    return res.status(500).json({ error: 'PayPal capture failed' });
  }
}