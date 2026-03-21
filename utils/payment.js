// Load Razorpay SDK dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const handleRazorpayPayment = async (user, amount, description, onSuccess) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert('Failed to load Razorpay. Please try again.');
    throw new Error('Razorpay SDK failed to load');
  }

  const key = import.meta.env.VITE_RAZORPAY_KEY;
  if (!key) {
    alert('Payment configuration error. Please contact support.');
    throw new Error('Razorpay key not configured');
  }

  // Step 1: Create order on server
  let order;
  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, planName: description }),
    });

    const data = await response.json();
    if (!response.ok || !data.order?.id) {
      throw new Error(data.message || 'Failed to create order');
    }
    order = data.order;
  } catch (error) {
    console.error('Order creation failed:', error);
    alert('Failed to initiate payment. Please try again.');
    throw error;
  }

  // Step 2: Open Razorpay checkout with order_id
  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: 'SolOS',
      description,
      handler: async function (response) {
        // Step 3: Verify payment on server
        try {
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Payment verification failed');
          }

          // Step 4: Return verified payment data
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve(verifyData);
        } catch (error) {
          console.error('Payment verification failed:', error);
          alert('Payment was received but verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          reject(error);
        }
      },
      prefill: {
        name: user.displayName || 'User',
        email: user.email || '',
      },
      theme: { color: '#10b981' },
      modal: {
        ondismiss: function () {
          console.log('Payment cancelled');
          reject(new Error('Payment cancelled by user'));
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  });
};