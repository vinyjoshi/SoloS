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
    return;
  }

  const key = import.meta.env.VITE_RAZORPAY_KEY;
  if (!key) {
    console.error('Razorpay key not configured');
    alert('Payment configuration error. Please contact support.');
    return;
  }

  const options = {
    key,
    amount: amount * 100,
    currency: 'INR',
    name: 'SolOS',
    description,
    handler: function (response) { onSuccess(response); },
    prefill: {
      name: user.displayName || 'User',
      email: user.email || '',
    },
    theme: { color: '#10b981' },
    modal: { ondismiss: function () { console.log('Payment cancelled'); } },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};